import {describe,it,expect} from 'vitest';
import {encodeMessage,LineReceiver,MAX_LINE_BYTES} from '../../src/services/protocol';
describe('wire encoding',()=>{
  it('round-trips UTF-8 across single-byte packet boundaries',()=>{
    const message={v:1 as const,type:'nav',instruction:'Rẽ phải vào đường Nguyễn Huệ'};
    const receiver=new LineReceiver();
    expect(encodeMessage(message,1).flatMap(part=>receiver.push(part))).toEqual([message]);
  });
  it('rejects invalid packet sizes',()=>{
    expect(()=>encodeMessage({v:1,type:'hello'},0)).toThrow();
    expect(()=>encodeMessage({v:1,type:'hello'},513)).toThrow();
  });
  it('rejects overlong messages',()=>{
    expect(()=>encodeMessage({v:1,type:'nav',instruction:'a'.repeat(MAX_LINE_BYTES)},20)).toThrow();
  });
  it('resynchronizes after an invalid frame',()=>{
    const receiver=new LineReceiver();
    expect(receiver.push(new TextEncoder().encode('{bad}\n{"v":1,"type":"stop"}\n'))).toEqual([{v:1,type:'stop'}]);
  });
});
