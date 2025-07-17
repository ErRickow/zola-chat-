import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { python } from '@codemirror/lang-python';

interface CodeMirrorEditorProps {
  code: string;
  language: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  theme?: 'light' | 'dark';
}

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
      return python();
    case 'json':
      return javascript({ jsx: false, typescript: false });
    case 'yaml':
    case 'yml':
      return [];
    default:
      return [];
  }
};

const getThemeExtension = (currentTheme: string) => {
  return currentTheme === 'dark' ? oneDark : EditorView.baseTheme({});
};

export function CodeMirrorEditor({ code, language, readOnly = true, onChange, theme = 'dark' }: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const languageCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  // Gunakan useCallback untuk memoize fungsi agar tidak dibuat ulang setiap render
  const memoizedGetLanguageExtension = useCallback(getLanguageExtension, []);
  const memoizedGetThemeExtension = useCallback(getThemeExtension, []);


  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        EditorView.editable.of(!readOnly),
        languageCompartment.current.of(memoizedGetLanguageExtension(language)),
        themeCompartment.current.of(memoizedGetThemeExtension(theme)),
        EditorView.scrollPastEnd,
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
  }, []); // Dependensi kosong agar hanya dijalankan sekali

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
        effects: languageCompartment.current.reconfigure(memoizedGetLanguageExtension(language)),
      });
    }
  }, [language, editorView, memoizedGetLanguageExtension]);

  // Efek untuk memperbarui tema jika prop 'theme' berubah
  useEffect(() => {
    if (editorView) {
      editorView.dispatch({
        effects: themeCompartment.current.reconfigure(memoizedGetThemeExtension(theme)),
      });
    }
  }, [theme, editorView, memoizedGetThemeExtension]);

  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-hidden rounded-lg"
    />
  );
}
