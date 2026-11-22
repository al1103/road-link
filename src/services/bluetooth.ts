import { Capacitor } from '@capacitor/core';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { encodeMessage, MAX_LINE_BYTES, SERVICE_UUID, STATUS_UUID, WRITE_UUID, type WireMessage } from './protocol';
export type BluetoothState = { status: 'disconnected' | 'connecting' | 'connected'; name?: string; error?: string; received?: string };
type Batch = { messages: WireMessage[]; kind: 'route' | 'nav' | 'control'; generation: number };
export class BluetoothLink {
  private id?: string;
  private payloadBytes = 20;
  private pending: Batch[] = [];
  private draining = false;
  private generation = 0;
  private state: BluetoothState = { status: 'disconnected' };
  private listener?: (state: BluetoothState) => void;
  subscribe(listener: (state: BluetoothState) => void) { this.listener = listener; listener(this.state); return () => { this.listener = undefined; }; }
  private emit(state: BluetoothState) { this.state = state; this.listener?.(state); }
  async connect() {
    if (this.state.status !== 'disconnected') return;
    if (!Capacitor.isNativePlatform() && !('bluetooth' in navigator)) { this.emit({ status: 'disconnected', error: 'Trình duyệt này không hỗ trợ BLE. Hãy dùng bản iOS hoặc Chrome có Web Bluetooth. Dẫn đường vẫn hoạt động bình thường.' }); return; }
    this.emit({ status: 'connecting' });
    let deviceId: string | undefined;
    try {
      await BleClient.initialize();
      const device = await BleClient.requestDevice({ services: [SERVICE_UUID], namePrefix: 'RoadLink' });
      deviceId = device.deviceId;
      await BleClient.connect(deviceId, () => {
        this.id = undefined; this.pending = []; this.generation++;
        this.emit({ status: 'disconnected', error: 'ESP32 đã ngắt kết nối. Bạn vẫn có thể tiếp tục dẫn đường trên điện thoại.' });
      });
      this.id = deviceId;
      if (Capacitor.isNativePlatform()) { const mtu = await BleClient.getMtu(deviceId).catch(() => 23); this.payloadBytes = Math.max(20, Math.min(180, mtu - 3)); }
      await BleClient.startNotifications(deviceId, SERVICE_UUID, STATUS_UUID, data => {
        if (data.byteLength > MAX_LINE_BYTES) return;
        const received = new TextDecoder().decode(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
        this.emit({ ...this.state, received });
      });
      this.emit({ status: 'connected', name: device.name || 'RoadLink ESP32' });
      this.enqueue([{ v: 1, type: 'hello', app: 'RoadLink', protocol: 1 }], 'control');
    } catch {
      if (deviceId) await BleClient.disconnect(deviceId).catch(() => undefined);
      this.id = undefined;
      this.emit({ status: 'disconnected', error: 'Chưa kết nối được ESP32 hoặc bạn đã hủy chọn thiết bị. Kiểm tra nguồn, Bluetooth và quyền truy cập rồi thử lại.' });
    }
  }
  async disconnect() {
    const id = this.id; this.id = undefined; this.generation++; this.pending = [];
    if (id) await BleClient.disconnect(id).catch(() => undefined);
    this.emit({ status: 'disconnected' });
  }
  enqueue(messages: WireMessage[], kind: Batch['kind']) {
    if (!this.id) return;
    // A new route or stop invalidates all not-yet-sent route/navigation data.
    if (kind !== 'nav') { this.generation++; this.pending = []; }
    else this.pending = this.pending.filter(b => b.kind !== 'nav');
    this.pending.push({ messages, kind, generation: this.generation });
    void this.drain();
  }
  private async drain() {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.id && this.pending.length) {
        const batch = this.pending.shift()!;
        for (const message of batch.messages) {
          if (!this.id || batch.generation !== this.generation) break;
          const id: string = this.id;
          // Finish each line before replacing a batch: never leave a partial JSON frame.
          for (const chunk of encodeMessage(message, this.payloadBytes)) {
            if (this.id !== id) break;
            await BleClient.write(id, SERVICE_UUID, WRITE_UUID, new DataView(chunk.buffer as ArrayBuffer, chunk.byteOffset, chunk.byteLength));
          }
        }
      }
    } catch {
      const id = this.id; this.id = undefined; this.pending = [];
      if (id) await BleClient.disconnect(id).catch(() => undefined);
      this.emit({ status: 'disconnected', error: 'Gửi BLE thất bại. Dẫn đường trên điện thoại vẫn tiếp tục; bạn có thể kết nối lại.' });
    } finally { this.draining = false; }
  }
}
