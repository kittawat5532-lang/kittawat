import React, { useState, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  Link2, 
  FileCheck, 
  AlertCircle, 
  Loader2, 
  BookPlus, 
  CheckCircle2 
} from 'lucide-react';
import { Resource, MediaType, GRADE_LEVELS, MEDIA_TYPES } from '../types';
import { useAuth } from '../context/AuthContext';
import { createResource, updateResource, uploadResourceFile } from '../services/resourceService';

interface PostResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  initialResource?: Resource | null;
  onSuccess: (resourceId: string, isEdit: boolean) => void;
}

export const PostResourceModal: React.FC<PostResourceModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialResource,
  onSuccess,
}) => {
  const { currentUser, userProfile, isSuspended } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [gradeLevel, setGradeLevel] = useState(GRADE_LEVELS[1] || 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)');
  const [mediaType, setMediaType] = useState<MediaType>('pdf');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (initialResource) {
      setTitle(initialResource.title);
      setDescription(initialResource.description || '');
      setCategory(initialResource.category);
      setGradeLevel(initialResource.gradeLevel);
      setMediaType(initialResource.mediaType);
      setUrl(initialResource.url || initialResource.fileUrl || '');
      setSelectedFile(null);
    } else {
      setTitle('');
      setDescription('');
      setCategory(categories[0] || 'คอมพิวเตอร์และเทคโนโลยี');
      setGradeLevel(GRADE_LEVELS[1] || 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)');
      setMediaType('pdf');
      setUrl('');
      setSelectedFile(null);
    }
    setErrorMsg('');
    setSuccessMsg('');
    setUploadProgress(null);
  }, [initialResource, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isSuspended) {
      setErrorMsg('บัญชีของคุณถูกระงับการใช้งานชั่วคราว ไม่สามารถเผยแพร่สื่อได้');
      return;
    }

    if (!currentUser) {
      setErrorMsg('กรุณาเข้าสู่ระบบก่อนทำการโพสต์');
      return;
    }

    // Client-side validations
    if (title.trim().length < 3) {
      setErrorMsg('กรุณาระบุชื่อสื่อการเรียนรู้ความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if (!category) {
      setErrorMsg('กรุณาเลือกหมวดหมู่ความรู้');
      return;
    }

    if (!url.trim() && !selectedFile && !initialResource?.fileUrl) {
      setErrorMsg('กรุณาใส่ลิงก์สื่อการเรียนรู้ หรือเลือกไฟล์เพื่ออัปโหลด');
      return;
    }

    setSubmitting(true);

    try {
      let fileUrl = initialResource?.fileUrl || '';
      let fileName = initialResource?.fileName || '';

      // Upload file to Firebase Storage if selected
      if (selectedFile) {
        setUploadProgress(10);
        const uploadResult = await uploadResourceFile(
          selectedFile, 
          currentUser.uid, 
          (pct) => setUploadProgress(pct)
        );
        fileUrl = uploadResult.downloadUrl;
        fileName = uploadResult.fileName;
      }

      if (initialResource) {
        // Edit existing
        await updateResource(initialResource.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          gradeLevel,
          mediaType,
          url: url.trim(),
          fileUrl: fileUrl || undefined,
          fileName: fileName || undefined,
        });
        setSuccessMsg('แก้ไขข้อมูลสื่อการเรียนรู้สำเร็จเรียบร้อย!');
        setTimeout(() => {
          onSuccess(initialResource.id, true);
          onClose();
        }, 1000);
      } else {
        // Create new
        const newId = await createResource({
          title: title.trim(),
          description: description.trim(),
          category,
          gradeLevel,
          mediaType,
          url: url.trim(),
          fileUrl,
          fileName,
          authorId: currentUser.uid,
          authorName: userProfile?.displayName || currentUser.displayName || 'ผู้ใช้งาน',
          authorEmail: currentUser.email || ''
        });
        setSuccessMsg('แบ่งปันสื่อการเรียนรู้ลงคลังข้อมูลสำเร็จเรียบร้อย!');
        setTimeout(() => {
          onSuccess(newId, false);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {initialResource ? 'แก้ไขสื่อการเรียนรู้' : 'ร่วมแบ่งปันสื่อการเรียนรู้ใหม่'}
              </h3>
              <p className="text-xs text-slate-500">
                แบ่งปันเพื่อเป็นวิทยาทานแก่นักเรียน นักศึกษา และครูทั่วประเทศ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ชื่อสื่อการเรียนรู้ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สรุปสูตรฟิสิกส์ ม.ปลาย, ชีทสรุปไวยากรณ์ภาษาอังกฤษ..."
              maxLength={200}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-sm"
            />
          </div>

          {/* Category & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                หมวดหมู่วิชา <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-sm cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ระดับชั้นเป้าหมาย <span className="text-rose-500">*</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-sm cursor-pointer"
              >
                {GRADE_LEVELS.filter((g) => g !== 'ทั้งหมด').map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ประเภทของสื่อ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MEDIA_TYPES.map((m) => (
                <button
                  type="button"
                  key={m.type}
                  onClick={() => setMediaType(m.type)}
                  className={`p-2.5 text-xs font-medium rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    mediaType === m.type
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold ring-1 ring-blue-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" />
                ลิงก์สื่อภายนอก (Google Drive / YouTube / เว็บไซต์)
              </span>
              <span className="text-[11px] font-normal text-slate-400">ถ้ามี</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/... หรือ https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-sm"
            />
          </div>

          {/* File Upload to Firebase Storage */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <UploadCloud className="w-3.5 h-3.5" />
                หรือ อัปโหลดไฟล์เอกสาร / ชีทสรุป (Firebase Storage)
              </span>
              <span className="text-[11px] font-normal text-slate-400">PDF, รูปภาพ, ไฟล์ประกอบ</span>
            </label>
            
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-5 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium text-sm">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <span>เลือกไฟล์: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">
                      คลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      รองรับ PDF, DOCX, PPTX, JPG, PNG (สูงสุด 50MB)
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Upload progress */}
            {uploadProgress !== null && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>กำลังอัปโหลดขึ้น Firebase Storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              คำอธิบายรายละเอียด
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายว่าสื่อนี้เกี่ยวกับเรื่องอะไร เหมาะกับใคร หรือคำแนะนำการศึกษา..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-sm leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{initialResource ? 'บันทึกการแก้ไข' : 'เผยแพร่สู่คลังความรู้'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
