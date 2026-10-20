import React, { useState } from 'react';
import { X, Flag, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Resource } from '../types';
import { useAuth } from '../context/AuthContext';
import { submitReport } from '../services/reportService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = [
  'ลิงก์เสีย / ไฟล์เปิดไม่ได้ / สื่อถูกลบ',
  'เนื้อหาไม่เหมาะสม / ลามกอนาจาร / ความรุนแรง',
  'ละเมิดลิขสิทธิ์ / นำผลงานผู้อื่นมาลงโดยไม่ได้รับอนุญาต',
  'ข้อมูลไม่ถูกต้อง / บิดเบือน / สแปมหรือหลอกลวง',
  'หมวดหมู่วิชาหรือระดับชั้นไม่ถูกต้อง',
  'อื่นๆ (โปรดระบุรายละเอียด)'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  resource,
  onReportSubmitted
}) => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMsg('กรุณาเข้าสู่ระบบก่อนทำการรายงานเนื้อหา');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await submitReport({
        resourceId: resource.id,
        resourceTitle: resource.title,
        reporterId: currentUser.uid,
        reporterEmail: currentUser.email || 'anonymous',
        reason,
        details: details.trim()
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDetails('');
        if (onReportSubmitted) onReportSubmitted();
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการส่งรายงาน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-700">
            <Flag className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900">รายงานสื่อการเรียนรู้</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            กำลังรายงาน: <strong className="text-slate-800">{resource.title}</strong>
          </p>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>ส่งรายงานเรียบร้อยแล้ว ทีมงานจะดำเนินการตรวจสอบโดยเร็ว</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              สาเหตุของการรายงาน <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="ระบุตำแหน่งที่พบปัญหา หรือข้อมูลเพิ่มเติมแก่ผู้ดูแลระบบ..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>ส่งรายงาน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
