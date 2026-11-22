import { Bluetooth, BluetoothConnected, ChevronRight, Cpu, Radio, ShieldCheck, X } from 'lucide-react';
import type { BluetoothState } from '../services/bluetooth';
export default function BluetoothPanel({ state, close, connect, disconnect }: { state: BluetoothState; close: () => void; connect: () => void; disconnect: () => void }) {
  return <div className="modal-backdrop" onClick={close}>
    <section className="connection-panel" role="dialog" aria-modal="true" aria-labelledby="bluetooth-title" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') close(); }}>
      <button className="icon-button modal-close" onClick={close} aria-label="Đóng kết nối Bluetooth" autoFocus><X size={20} /></button>
      <div className="connection-art"><div className="radio-ring ring-1" /><div className="radio-ring ring-2" /><Bluetooth size={35} /><span className="cpu-bubble"><Cpu size={21} /></span></div>
      <span className="eyebrow">MỘT KẾT NỐI. THÊM KHẢ NĂNG.</span>
      <h2 id="bluetooth-title">Chỉ đường ngay trên ESP32.</h2>
      <p>Giữ điện thoại trong túi. Gửi hướng rẽ, khoảng cách và tuyến đường qua Bluetooth LE, không cần phát Wi-Fi.</p>
      <div className="connection-benefit"><Radio size={20} /><div><strong>Kết nối trực tiếp</strong><span>iPhone ↔ ESP32 qua BLE</span></div><ChevronRight size={16} /></div>
      <div className="connection-benefit"><ShieldCheck size={20} /><div><strong>Hoạt động độc lập</strong><span>Không có ESP32? Điện thoại vẫn dẫn đường.</span></div></div>
      {state.error && <div className="inline-error" role="alert">{state.error}</div>}
      {state.status === 'connected' ? <><div className="connected-device"><BluetoothConnected size={22} /><div><strong>{state.name}</strong><span>Đã kết nối · Sẵn sàng nhận chỉ dẫn</span></div></div><button className="button secondary full" onClick={disconnect}>Ngắt kết nối</button></> : <button className="button primary full" onClick={connect} disabled={state.status === 'connecting'}><Bluetooth size={20} />{state.status === 'connecting' ? 'Đang chọn thiết bị…' : 'Tìm ESP32 của bạn'}</button>}
      <p className="fine-print">Cần firmware RoadLink BLE. Bản đầu truyền tuyến đường và chỉ dẫn, chưa truyền ảnh nền bản đồ. Dữ liệu BLE chưa được ghép đôi bảo mật; dùng để thử nghiệm.</p>
    </section>
  </div>;
}
