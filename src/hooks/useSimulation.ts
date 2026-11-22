import {useCallback,useEffect,useRef,useState} from 'react';
import {bearing,cumulative,pointAt} from '../domain/geometry';
import type {Fix,Route} from '../domain/types';

/** Explicit movement playback. Never replaces navigator.geolocation or native GPS. */
export function useSimulation(){
  const [active,setActive]=useState(false),[paused,setPaused]=useState(false),[rate,setRate]=useState(3),[fix,setFix]=useState<Fix|null>(null),[meters,setMeters]=useState(0);
  const path=useRef<{route:Route;lengths:number[];total:number;meters:number}|null>(null);
  const speedKmh=40;
  const at=useCallback((value:NonNullable<typeof path.current>):Fix=>{
    const point=pointAt(value.route.coordinates,value.lengths,value.meters),ahead=pointAt(value.route.coordinates,value.lengths,Math.min(value.total,value.meters+10));
    return {...point,accuracy:4,speed:speedKmh/3.6,heading:bearing(point,ahead),headingAvailable:value.meters<value.total,timestamp:Date.now()};
  },[]);
  const start=useCallback((route:Route)=>{
    const lengths=cumulative(route.coordinates),value={route,lengths,total:lengths.at(-1)??0,meters:0};
    path.current=value;setMeters(0);setFix(at(value));setPaused(false);setActive(true);
  },[at]);
  const stop=useCallback(()=>{setActive(false);setPaused(false);setFix(null);setMeters(0);path.current=null;},[]);
  useEffect(()=>{
    if(!active||paused)return;
    let previous=performance.now();
    const timer=setInterval(()=>{
      const value=path.current;if(!value)return;
      const now=performance.now(),seconds=Math.min(1,Math.max(0,(now-previous)/1000));previous=now;
      value.meters=Math.min(value.total,value.meters+seconds*speedKmh/3.6*rate);
      setMeters(value.meters);setFix(at(value));if(value.meters>=value.total)setPaused(true);
    },500);
    return()=>clearInterval(timer);
  },[active,paused,rate,at]);
  return {active,paused,rate,fix,meters,speedKmh,start,stop,setRate,toggle:()=>setPaused(value=>!value)};
}
