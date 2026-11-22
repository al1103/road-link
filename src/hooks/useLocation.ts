import {useCallback,useEffect,useRef,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {Geolocation,type Position} from '@capacitor/geolocation';
import {bearing,distance} from '../domain/geometry';
import {canNavigateFrom,locationIssue,validLocation,type LocationIssue} from '../domain/location';
import type {Fix} from '../domain/types';

export function useLocation() {
  const [fix,setFix]=useState<Fix|null>(null);
  const [issue,setIssue]=useState<LocationIssue|null>(null);
  const [requesting,setRequesting]=useState(false);
  const watch=useRef<string|null>(null);
  const generation=useRef(0),enabled=useRef(false);
  const latest=useRef<Fix|null>(null),anchor=useRef<Fix|null>(null);
  const lastCourse=useRef<{value:number;timestamp:number}|null>(null);

  const clearWatch=useCallback(()=>{
    const id=watch.current;watch.current=null;
    if(id!==null)void Geolocation.clearWatch({id}).catch(()=>undefined);
  },[]);
  const stop=useCallback(()=>{
    enabled.current=false;generation.current++;clearWatch();setRequesting(false);
  },[clearWatch]);

  const start=useCallback(async()=>{
    // Every explicit retry starts a new watch, including after timeout/provider failure.
    const current=++generation.current;enabled.current=true;clearWatch();
    setRequesting(true);setIssue(null);
    const native=Capacitor.isNativePlatform();
    if(!native&&!window.isSecureContext){setRequesting(false);setIssue({kind:'insecure',text:'Định vị web cần HTTPS hoặc localhost trên chính thiết bị. Địa chỉ IP mạng nội bộ qua HTTP không cấp được vị trí.'});return;}
    if(!native&&!navigator.geolocation){setRequesting(false);setIssue({kind:'unsupported',text:'Trình duyệt này không cung cấp vị trí. Bạn vẫn có thể chọn điểm đi thủ công.'});return;}

    const receive=(position:Position)=>{
      if(current!==generation.current)return;
      const c=position.coords;
      const next:Fix={lat:c.latitude,lng:c.longitude,accuracy:c.accuracy,timestamp:position.timestamp,speed:c.speed!==null&&Number.isFinite(c.speed)?Math.max(0,c.speed):0,heading:0,headingAvailable:false};
      const now=Date.now();
      if(!validLocation(next)||now-next.timestamp>120000||next.timestamp-now>5000)return;
      const last=latest.current;
      if(last&&(next.timestamp<last.timestamp||(now-last.timestamp<15000&&next.accuracy>Math.max(65,last.accuracy*2))))return;
      // Plugin 8.2+ distinguishes travel course from the phone's compass heading.
      let course=typeof c.course==='number'&&Number.isFinite(c.course)&&c.course>=0&&next.speed>.3?c.course:null;
      const previous=anchor.current;
      if(course===null&&previous&&next.accuracy<=25&&previous.accuracy<=25&&next.timestamp>previous.timestamp&&next.timestamp-previous.timestamp<12000&&distance(previous,next)>=Math.max(4,(previous.accuracy+next.accuracy)/2))course=bearing(previous,next);
      if(course!==null)lastCourse.current={value:(course%360+360)%360,timestamp:next.timestamp};
      next.heading=lastCourse.current?.value??0;
      next.headingAvailable=next.accuracy<=25&&!!lastCourse.current&&next.timestamp-lastCourse.current.timestamp<12000;
      if(!previous||distance(previous,next)>=4||next.timestamp-previous.timestamp>8000)anchor.current=next;
      latest.current=next;setFix(next);setIssue(null);setRequesting(false);
    };
    const failed=(error:unknown)=>{
      if(current!==generation.current)return;
      // A failed fresh request does not erase a recently acquired precise fix.
      if(!canNavigateFrom(latest.current))setIssue(locationIssue(error));
      setRequesting(false);
      if(locationIssue(error).kind==='permission'){generation.current++;clearWatch();}
    };
    try {
      if(native){
        const permissions=await Geolocation.requestPermissions();
        if(current!==generation.current)return;
        if(permissions.location==='denied'){failed({code:1});return;}
      }
      // Warm start for map/route preview; navigation keeps its own accuracy/freshness checks.
      void Geolocation.getCurrentPosition({enableHighAccuracy:false,maximumAge:120000,timeout:8000}).then(receive).catch(()=>undefined);
      const id=await Geolocation.watchPosition({enableHighAccuracy:true,timeout:30000,maximumAge:0,minimumUpdateInterval:1000,interval:1000},(position,error)=>{
        if(position)receive(position);else if(error)failed(error);
      });
      if(current!==generation.current){await Geolocation.clearWatch({id});return;}
      watch.current=id;
    }catch(error){failed(error);}
  },[clearWatch]);

  useEffect(()=>{
    let disposed=false;
    // Resume an existing grant without prompting on first visit.
    void Geolocation.checkPermissions().then(p=>{if(!disposed&&!enabled.current&&p.location==='granted')void start();}).catch(()=>undefined);
    const resume=()=>{
      if(enabled.current&&document.visibilityState==='visible'&&!canNavigateFrom(latest.current))void start();
    };
    document.addEventListener('visibilitychange',resume);window.addEventListener('pageshow',resume);
    return()=>{disposed=true;document.removeEventListener('visibilitychange',resume);window.removeEventListener('pageshow',resume);stop();};
  },[start,stop]);
  return {fix,issue,error:issue?.text??null,requesting,start,stop};
}
