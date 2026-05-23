import React, { useState, useEffect } from "react";
import { Plus, Upload, Trash2, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import documentService from "../../services/documentService";
import Spinner from "../../components/common/Spinner";
import Button from "../../components/common/Button";
import DocumentCard from "../../components/documents/DocumentCard";
import styles from "./DocumentListPage.module.css";

const DocumentListPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchDocuments = async () => {
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch {
      toast.error("Failed to fetch documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) { toast.error("Please provide a title and select a file."); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle);
    try {
      await documentService.uploadDocument(formData);
      toast.success("Document uploaded successfully!");
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle("");
      setLoading(true);
      fetchDocuments();
    } catch (error) {
      toast.error(error.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;
    setDeleting(true);
    try {
      await documentService.deleteDocument(selectedDoc._id);
      toast.success(`'${selectedDoc.title}' deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedDoc(null);
      setDocuments(documents.filter((d) => d._id !== selectedDoc._id));
    } catch (error) {
      toast.error(error.message || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  const renderContent = () => {
    if (loading) return <div className={styles.loadingWrap}><Spinner /></div>;

    if (documents.length === 0) {
      return (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyInner}>
            <div className={styles.emptyIcon}><FileText size={40} strokeWidth={1.5} /></div>
            <h3 className={styles.emptyTitle}>No Documents Yet</h3>
            <p className={styles.emptyDesc}>Get started by uploading your first PDF document to begin learning.</p>
            <button onClick={() => setIsUploadModalOpen(true)} className={styles.emptyBtn}>
              <Plus size={16} strokeWidth={2.5} /> Upload Document
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.grid}>
        {documents.map((doc) => (
          <DocumentCard key={doc._id} document={doc} onDelete={(d) => { setSelectedDoc(d); setIsDeleteModalOpen(true); }} />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.dotPattern} />
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h1>My Documents</h1>
            <p>Manage and organize your learning materials</p>
          </div>
          {documents.length > 0 && (
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Plus size={16} strokeWidth={2.5} /> Upload Document
            </Button>
          )}
        </div>
        {renderContent()}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalPanel}>
            <button onClick={() => setIsUploadModalOpen(false)} className={styles.modalCloseBtn}>
              <X size={20} strokeWidth={2} />
            </button>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Upload New Document</h2>
              <p className={styles.modalSubtitle}>Add a PDF document to your library</p>
            </div>
            <form onSubmit={handleUpload} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Document Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  className={styles.textInput}
                  placeholder="e.g., React Interview Prep"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>PDF File</label>
                <div className={styles.dropzone}>
                  <input id="file-upload" type="file" className={styles.fileInput} onChange={handleFileChange} accept=".pdf" />
                  <div className={styles.dropzoneContent}>
                    <div className={styles.dropzoneIcon}><Upload size={28} strokeWidth={2} /></div>
                    <p className={styles.dropzoneText}>
                      {uploadFile
                        ? <span className={styles.dropzoneTextHighlight}>{uploadFile.name}</span>
                        : <><span className={styles.dropzoneTextHighlight}>Click to upload</span> or drag and drop</>
                      }
                    </p>
                    <p className={styles.dropzoneHint}>PDF up to 10MB</p>
                  </div>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setIsUploadModalOpen(false)} disabled={uploading} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={uploading} className={styles.submitBtn}>
                  {uploading ? <><span className={styles.spinnerRing} /> Uploading...</> : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalPanel} style={{ maxWidth: '448px' }}>
            <button onClick={() => setIsDeleteModalOpen(false)} className={styles.modalCloseBtn}>
              <X size={20} strokeWidth={2} />
            </button>
            <div className={styles.deleteIconWrap}><Trash2 size={24} strokeWidth={2} /></div>
            <h2 className={styles.modalTitle}>Confirm Deletion</h2>
            <p className={styles.deleteText}>
              Are you sure you want to delete <strong>{selectedDoc?.title}</strong>? This action cannot be undone.
            </p>
            <div className={styles.formActions}>
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleConfirmDelete} disabled={deleting} className={styles.deleteBtn}>
                {deleting ? <><span className={styles.spinnerRing} /> Deleting...</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentListPage;
