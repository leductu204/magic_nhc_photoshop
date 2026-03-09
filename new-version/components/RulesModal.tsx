
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[200] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#111] border border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-[#151515]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📌</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">NỘI QUY SỬ DỤNG TOOL</h2>
              <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Nền tảng AI Studio</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 text-gray-300">
          <section className="space-y-3">
            <h3 className="text-sky-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
              I. MỤC ĐÍCH ÁP DỤNG
            </h3>
            <div className="pl-4 border-l border-zinc-800 space-y-2 text-sm">
              <p>Nội quy này nhằm:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                <li>Đảm bảo việc sử dụng các tool AI Studio đúng mục đích – hiệu quả – an toàn</li>
                <li>Tránh lạm dụng, vi phạm chính sách nền tảng và pháp luật</li>
                <li>Nâng cao trách nhiệm cá nhân khi khai thác công cụ AI</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sky-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
              II. PHẠM VI ÁP DỤNG
            </h3>
            <div className="pl-4 border-l border-zinc-800 space-y-2 text-sm">
              <p>Áp dụng cho tất cả cá nhân/nhân sự được cấp quyền sử dụng tool trên nền tảng AI Studio</p>
              <p className="text-gray-400 italic">Bao gồm: tool viết nội dung, tạo hình ảnh, phân tích dữ liệu, chạy quảng cáo, automation, chatbot, v.v.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sky-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
              III. NGUYÊN TẮC CHUNG
            </h3>
            <div className="pl-4 border-l border-zinc-800 space-y-2 text-sm">
              <ul className="list-decimal pl-5 space-y-2">
                <li>Sử dụng tool đúng mục đích công việc được phân công</li>
                <li>Không dùng AI Studio cho các hoạt động:
                  <ul className="list-disc pl-5 mt-1 text-gray-400">
                    <li>Trái pháp luật</li>
                    <li>Gian lận, lừa đảo</li>
                    <li>Xâm phạm quyền riêng tư, bản quyền</li>
                  </ul>
                </li>
                <li>Chịu trách nhiệm hoàn toàn về nội dung đầu ra do mình tạo và sử dụng</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sky-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
              IV. QUY ĐỊNH CỤ THỂ
            </h3>
            <div className="pl-4 border-l border-zinc-800 space-y-6 text-sm">
              <div className="space-y-2">
                <h4 className="font-bold text-white">1. Quy định về tài khoản</h4>
                <ul className="list-disc pl-5 text-gray-400">
                  <li>Không chia sẻ tài khoản, API key, quyền truy cập cho người khác</li>
                  <li>Không đăng nhập trên thiết bị lạ khi chưa được cho phép</li>
                  <li>Thoát tài khoản sau khi sử dụng xong</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white">2. Quy định về nội dung tạo ra</h4>
                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-2">
                  <p className="font-black text-red-400 text-xs uppercase tracking-widest">❌ CẤM tạo nội dung:</p>
                  <ul className="list-disc pl-5 text-gray-400 text-xs space-y-1">
                    <li>Thông tin sai sự thật, xuyên tạc, kích động thù hằn</li>
                    <li>Nội dung vi phạm thuần phong mỹ tục</li>
                    <li>Nội dung giả mạo cá nhân, tổ chức</li>
                    <li>Spam, seeding ảo, thao túng dư luận</li>
                    <li className="font-bold text-red-400">Không chỉnh sửa can thiệp vào Tool</li>
                  </ul>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                  <p className="font-black text-emerald-400 text-xs uppercase tracking-widest">✅ ĐƯỢC PHÉP:</p>
                  <ul className="list-disc pl-5 text-gray-400 text-xs space-y-1">
                    <li>Sáng tạo nội dung marketing, quảng cáo, học tập</li>
                    <li>Hỗ trợ công việc, tối ưu quy trình</li>
                    <li>Phân tích dữ liệu, gợi ý chiến lược</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white">3. Quy định khi chạy quảng cáo bằng tool</h4>
                <ul className="list-disc pl-5 text-gray-400">
                  <li>Không tạo quảng cáo vi phạm chính sách Facebook/Google/TikTok</li>
                  <li>Không sử dụng AI để lách luật, che giấu nội dung cấm</li>
                  <li>Nội dung quảng cáo phải: Trung thực, Không gây hiểu nhầm, Có kiểm tra lại trước khi đăng</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white">4. Quy định về dữ liệu</h4>
                <ul className="list-disc pl-5 text-gray-400">
                  <li>Không nhập dữ liệu: Thông tin cá nhân nhạy cảm (CMND, CCCD, tài khoản ngân hàng…), Dữ liệu nội bộ chưa được phép công khai</li>
                  <li>Bảo mật mọi thông tin khách hàng, đối tác</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sky-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
              V. KIỂM SOÁT & GIÁM SÁT
            </h3>
            <div className="pl-4 border-l border-zinc-800 space-y-2 text-sm">
              <ul className="list-disc pl-5 text-gray-400">
                <li>Mọi hoạt động sử dụng tool có thể được ghi nhận log</li>
                <li>Quản trị viên có quyền: Kiểm tra lịch sử sử dụng, Thu hồi quyền truy cập khi cần thiết</li>
                <li className="font-bold text-yellow-500">Bảo hành qua Gmail , mất Gmail là mất tool , đã can thiệp chỉnh sửa vào tool là không còn bảo hành</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sky-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
              VI. XỬ LÝ VI PHẠM
            </h3>
            <div className="pl-4 border-l border-zinc-800 space-y-2 text-sm">
              <p>Tùy mức độ vi phạm:</p>
              <ul className="list-disc pl-5 text-gray-400">
                <li>Nhắc nhở – cảnh cáo</li>
                <li>Tạm khóa quyền sử dụng tool</li>
                <li>Thu hồi quyền vĩnh viễn</li>
                <li>Bồi thường thiệt hại (nếu có)</li>
                <li>Chịu trách nhiệm trước pháp luật (trường hợp nghiêm trọng)</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sky-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
              VII. HIỆU LỰC
            </h3>
            <div className="pl-4 border-l border-zinc-800 space-y-2 text-sm">
              <p>Nội quy có hiệu lực kể từ ngày ban hành</p>
              <p className="font-bold text-white">Mọi người dùng AI Studio bắt buộc đọc – hiểu – tuân thủ.</p>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-[#151515] flex flex-col items-center gap-2">
          <p className="text-xs font-black text-white uppercase tracking-tighter">TOOL MAGIC NHC VIP PRO</p>
          <p className="text-[10px] text-gray-500 font-medium italic">Xin chân thành cảm ơn Quý Khách Hàng đã tin tưởng và sử dụng, THANKS</p>
          <button 
            onClick={onClose}
            className="mt-4 px-10 py-3 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl transition-all uppercase text-xs tracking-widest shadow-lg shadow-sky-900/20"
          >
            Tôi đã đọc và đồng ý
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
