import React, { useRef, useEffect, useState } from 'react';
import { EditorView, basicSetup } from '@codemirror/basic-setup';
import { EditorState, Compartment } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark'; // Contoh tema gelap
import { StreamLanguage } from '@codemirror/language';
import { python } from '@codemirror/legacy-modes/mode/python'; // Contoh: untuk Python lama

interface CodeMirrorEditorProps {
  code: string;
  language: string; // e.g., 'javascript', 'typescript', 'css', 'html', 'python', 'json', 'yaml'
  readOnly?: boolean;
  onChange?: (value: string) => void;
  theme?: 'light' | 'dark';
}

export function CodeMirrorEditor({ code, language, readOnly = true, onChange, theme = 'dark' }: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const languageCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Fungsi untuk mendapatkan ekstensi bahasa yang sesuai
    const getLanguageExtension = (lang: string) => {
      switch (lang) {
        case 'javascript':
        case 'js':
          return javascript();
        case 'typescript':
        case 'ts':
        case 'tsx':
          return javascript({ jsx: true, typescript: true });
        case 'html':
        case 'htm':
          return html();
        case 'css':
          return css();
        case 'python':
        case 'py':
          return StreamLanguage.define(python); // Menggunakan legacy-modes untuk Python
        case 'json':
          // CodeMirror 6 tidak memiliki lang-json bawaan, bisa pakai lang-javascript dengan mode json
          return javascript({ jsx: false, typescript: false }); // Atau cari ekstensi json pihak ketiga
        case 'yaml':
        case 'yml':
          // Tidak ada ekstensi bawaan, bisa pakai plaintext atau cari pihak ketiga
          return [];
        default:
          return []; // Plaintext atau tidak ada highlighting
      }
    };

    // Fungsi untuk mendapatkan tema yang sesuai
    const getThemeExtension = (currentTheme: string) => {
      return currentTheme === 'dark' ? oneDark : EditorView.baseTheme({}); // oneDark untuk tema gelap, tema dasar kosong untuk terang
    };

    const startState = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        EditorView.editable.of(!readOnly),
        languageCompartment.current.of(getLanguageExtension(language)),
        themeCompartment.current.of(getThemeExtension(theme)),
        EditorView.lineWrapping, // Mengaktifkan word wrap
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange && !readOnly) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    setEditorView(view);

    return () => {
      view.destroy();
      setEditorView(null);
    };
  }, []); // Hanya inisialisasi sekali saat mount

  // Efek untuk memperbarui kode jika prop 'code' berubah dari luar
  useEffect(() => {
    if (editorView && code !== editorView.state.doc.toString()) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: code },
      });
    }
  }, [code, editorView]);

  // Efek untuk memperbarui bahasa jika prop 'language' berubah
  useEffect(() => {
    if (editorView) {
      editorView.dispatch({
        effects: languageCompartment.current.reconfigure(getLanguageExtension(language)),
      });
    }
  }, [language, editorView]);

  // Efek untuk memperbarui tema jika prop 'theme' berubah
  useEffect(() => {
    if (editorView) {
      editorView.dispatch({
        effects: themeCompartment.current.reconfigure(getThemeExtension(theme)),
      });
    }
  }, [theme, editorView]);


  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-hidden rounded-lg" // Pastikan CodeMirror mengisi kontainer
    />
  );
}
