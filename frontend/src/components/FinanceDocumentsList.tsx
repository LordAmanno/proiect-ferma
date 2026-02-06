import { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Calendar, File as FileIcon, Loader2, X, Download } from 'lucide-react';
import { useFinanceDocuments, type FinanceDocument } from '../hooks/useFinanceDocuments';
import { ConfirmationModal } from './ConfirmationModal';
import { format, parseISO } from 'date-fns';

export function FinanceDocumentsList() {
  const { documents, loading, error, uploadDocument, deleteDocument, refreshDocuments } = useFinanceDocuments();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<FinanceDocument | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  // Close modals on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUploadModal(false);
        setShowPreviewModal(false);
        setShowDeleteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const handlePreview = (doc: FinanceDocument) => {
    setPreviewDoc(doc);
    setShowPreviewModal(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event bubbling
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      // Upload all files sequentially (or parallel if preferred)
      for (const file of selectedFiles) {
        await uploadDocument(file, uploadDate);
      }
      
      await refreshDocuments(); // Force refresh to ensure list is up to date
      setShowUploadModal(false);
      setSelectedFiles([]);
      setUploadDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDocumentToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (documentToDelete) {
      await deleteDocument(documentToDelete);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  // Group documents by date
  const groupedDocuments = documents.reduce((acc, doc) => {
    const date = doc.documentDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(doc);
    return acc;
  }, {} as Record<string, FinanceDocument[]>);

  const sortedDates = Object.keys(groupedDocuments).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-600" /></div>;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Financial Documents</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Upload size={18} /> Upload Document
        </button>
      </div>

      {error ? (
        <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
          {error}. Please ensure the backend server is running.
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                <Calendar size={18} className="text-gray-500" />
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                  {format(parseISO(date), 'MMMM d, yyyy')}
                </h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedDocuments[date].map(doc => (
                  <div 
                    key={doc.id} 
                    className="group relative bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
                    onClick={() => handlePreview(doc)}
                  >
                    {/* Thumbnail / Icon Area */}
                    <div className="h-32 bg-gray-50 dark:bg-gray-800 flex items-center justify-center border-b border-gray-100 dark:border-gray-800 relative group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-colors">
                      {doc.fileType.startsWith('image/') ? (
                        <img 
                          src={doc.publicUrl} 
                          alt={doc.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.classList.add('fallback-icon');
                          }}
                        />
                      ) : (
                        <div className={`p-4 rounded-full ${
                          doc.fileType.includes('pdf') ? 'bg-red-100 text-red-600' :
                          doc.fileType.includes('sheet') || doc.fileType.includes('excel') ? 'bg-green-100 text-green-600' :
                          doc.fileType.includes('word') || doc.fileType.includes('document') ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <FileIcon size={32} />
                        </div>
                      )}
                      
                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                         <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(doc.publicUrl, '_blank');
                          }}
                          className="p-2 bg-white text-gray-700 rounded-full hover:text-blue-600 hover:scale-110 transition-all shadow-lg"
                          title="Download"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(doc.id);
                          }}
                          className="p-2 bg-white text-gray-700 rounded-full hover:text-red-600 hover:scale-110 transition-all shadow-lg"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate" title={doc.name}>
                          {doc.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {(doc.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                          doc.fileType.includes('pdf') ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                          doc.fileType.includes('image') ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                          doc.fileType.includes('sheet') || doc.fileType.includes('excel') ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                          'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {doc.fileType.split('/')[1] || 'FILE'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowPreviewModal(false)}>
          {/* Increased size: w-[95vw] h-[95vh] */}
          <div className="relative w-[95vw] h-[95vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-md">
                  {previewDoc.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {format(parseISO(previewDoc.documentDate), 'MMMM d, yyyy')} • {(previewDoc.fileSize / 1024).toFixed(1)} KB
                  <span className="hidden sm:inline text-gray-400 ml-2 border-l border-gray-300 dark:border-gray-700 pl-2">Press ESC to close</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={previewDoc.publicUrl}
                  download
                  className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  <Download size={20} />
                </a>
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-4 overflow-auto flex items-center justify-center">
              {previewDoc.fileType.startsWith('image/') ? (
                <img 
                  src={previewDoc.publicUrl} 
                  alt={previewDoc.name} 
                  className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                />
              ) : previewDoc.fileType === 'application/pdf' ? (
                <iframe 
                  src={`${previewDoc.publicUrl}&inline=true`} 
                  className="w-full h-full rounded-lg shadow-lg bg-white"
                  title="PDF Preview"
                />
              ) : (
                <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 max-w-md">
                  <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                    previewDoc.fileType.includes('sheet') || previewDoc.fileType.includes('excel') ? 'bg-green-100 text-green-600' :
                    previewDoc.fileType.includes('word') || previewDoc.fileType.includes('document') ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <FileIcon size={40} />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Preview not available
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    This file type ({previewDoc.fileType}) cannot be previewed directly in the browser.
                  </p>
                  <a 
                    href={previewDoc.publicUrl}
                    download
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Download size={18} /> Download to View
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Document</h3>
                <p className="text-xs text-gray-400 hidden sm:block mt-1">(Press ESC to close)</p>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Date
                </label>
                <input
                  type="date"
                  required
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Files (PDF, Image, Word, Excel)
                </label>
                <div 
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload files</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" multiple />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, PNG, JPG, DOC, XLS up to 10MB
                    </p>
                  </div>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileIcon size={16} className="text-blue-500 shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || selectedFiles.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
