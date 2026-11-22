import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
type VoiceLike={lang:string;localService?:boolean;default?:boolean};
let generation=0;
export function vietnameseVoice<T extends VoiceLike>(voices:T[]):T|undefined {
  const lang=(v:T)=>v.lang.trim().toLowerCase().replace(/_/g,'-');
  const score=(v:T)=>(lang(v)==='vi-vn'?4:0)+(v.localService?2:0)+(v.default?1:0);
  return voices.filter(v=>/^vi(?:-|$)/.test(lang(v))).sort((a,b)=>score(b)-score(a))[0];
}
async function webVoices():Promise<SpeechSynthesisVoice[]> {
  const synth=window.speechSynthesis;
  const initial=synth.getVoices();if(vietnameseVoice(initial))return initial;
  return new Promise(resolve=>{
    const done=()=>{clearTimeout(timer);synth.removeEventListener('voiceschanged',changed);resolve(synth.getVoices());};
    const changed=()=>{if(vietnameseVoice(synth.getVoices()))done();};
    const timer=setTimeout(done,1500);synth.addEventListener('voiceschanged',changed);
    changed();
  });
}
export async function say(text: string): Promise<boolean> {
  const current=++generation;
  try {
    if (Capacitor.isNativePlatform()) {
      const {voices}=await TextToSpeech.getSupportedVoices();
      const voice=vietnameseVoice(voices);
      if(current!==generation)return true;
      if(!voice)return false;
      await TextToSpeech.stop();
      if(current!==generation)return true;
      await TextToSpeech.speak({ text, lang: 'vi-VN',voice:voices.indexOf(voice), rate: 0.95, pitch: 1, volume: 1, category: 'playback' });
    } else {
      if (!('speechSynthesis' in window)) return false;
      const voice=vietnameseVoice(await webVoices());
      if(current!==generation)return true;
      if(!voice)return false;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';utterance.voice=voice; utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
    return true;
  } catch { return false; }
}
export function silence() {
  generation++;
  if (Capacitor.isNativePlatform()) void TextToSpeech.stop().catch(() => undefined);
  else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
