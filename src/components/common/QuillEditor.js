// src/components/common/QuillEditor.js
import React, { useEffect, useRef } from 'react';

const QuillEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    // Tải Quill CSS
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Tải Quill script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js';
    script.async = true;

    script.onload = () => {
      // Khởi tạo Quill editor
      quillRef.current = new window.Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['link', 'image'],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
          ]
        },
        placeholder: 'Nhập nội dung...',
      });

      // Set giá trị ban đầu
      if (value) {
        quillRef.current.clipboard.dangerouslyPasteHTML(value);
      }

      // Event listener cho sự thay đổi nội dung
      quillRef.current.on('text-change', () => {
        const html = editorRef.current.querySelector('.ql-editor').innerHTML;
        onChange(html);
      });
    };

    document.body.appendChild(script);

    // Cleanup
    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  // Cập nhật nội dung khi value thay đổi từ bên ngoài
  useEffect(() => {
    if (quillRef.current && value) {
      if (quillRef.current.root.innerHTML !== value) {
        quillRef.current.clipboard.dangerouslyPasteHTML(value);
      }
    }
  }, [value]);

  return (
    <div>
      <div ref={editorRef} style={{ height: '250px' }}></div>
    </div>
  );
};

export default QuillEditor;