import * as React from 'react';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { html } from '@codemirror/lang-html';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers
} from '@codemirror/view';
import { defaultHighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import styles from './HtmlJsViewer.module.scss';
import { getIconWarnings } from './LucideIconRenderer';

export const MAX_HTML_FILE_BYTES = 1024 * 1024;
export const DEFAULT_DOWNLOAD_FILENAME = 'html-css-template.html';

export function validateHtmlFile(file: Pick<File, 'name' | 'size'>): string | undefined {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (extension !== '.html' && extension !== '.htm') {
    return 'Choose an .html or .htm file.';
  }
  if (file.size > MAX_HTML_FILE_BYTES) {
    return 'The HTML file must be 1 MB or smaller.';
  }
  return undefined;
}

export function readHtmlFile(file: File): Promise<string> {
  const validationError = validateHtmlFile(file);
  if (validationError) {
    return Promise.reject(new Error(validationError));
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('The selected file could not be read.'));
    reader.readAsText(file, 'utf-8');
  });
}

export function downloadHtmlDocument(htmlDocument: string, filename: string = DEFAULT_DOWNLOAD_FILENAME): void {
  const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export interface IHtmlDocumentEditorProps {
  value: string;
  onRunPreview: (value: string) => void;
  onSave: (value: string) => void;
  onCancel: () => void;
}

export function createHtmlEditorState(value: string, onChange: (value: string) => void): EditorState {
  return EditorState.create({
    doc: value,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      drawSelection(),
      history(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      html(),
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      })
    ]
  });
}

export default class HtmlDocumentEditor extends React.Component<IHtmlDocumentEditorProps> {
  private _host = React.createRef<HTMLDivElement>();
  private _fileInput = React.createRef<HTMLInputElement>();
  private _view: EditorView | undefined;
  private _draft: string = this.props.value;
  private _statusMessage: string = '';
  private _statusIsError: boolean = false;

  public componentDidMount(): void {
    this._warnAboutIcons(this._draft);
    if (this._host.current) {
      this._view = new EditorView({
        state: createHtmlEditorState(this._draft, value => {
          this._draft = value;
        }),
        parent: this._host.current
      });
    }
  }

  public componentDidUpdate(previousProps: IHtmlDocumentEditorProps): void {
    if (previousProps.value !== this.props.value && this.props.value !== this._draft) {
      this._replaceDocument(this.props.value);
    }
  }

  public componentWillUnmount(): void {
    this._view?.destroy();
    this._view = undefined;
  }

  public render(): React.ReactElement<IHtmlDocumentEditorProps> {
    return (
      <div className={styles.editorPanel}>
        <div className={styles.editorToolbar}>
          <input
            ref={this._fileInput}
            className={styles.hiddenFileInput}
            type="file"
            accept=".html,.htm,text/html"
            onChange={this._handleFileSelected}
          />
          <button type="button" onClick={this._openFilePicker}>Upload HTML</button>
          <button type="button" onClick={this._download}>Download HTML</button>
          <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer">Browse Lucide Icons</a>
        </div>
        {this._statusMessage && (
          <div className={this._statusIsError ? styles.editorError : styles.editorStatus} role="status" aria-live="polite">
            {this._statusMessage}
          </div>
        )}
        <div className={styles.editorHost} ref={this._host} />
        <div className={styles.editorActions}>
          <button type="button" onClick={this._runPreview}>Run Preview</button>
          <button type="button" onClick={this._save}>Save</button>
          <button type="button" onClick={this._cancel}>Cancel</button>
        </div>
      </div>
    );
  }

  private readonly _runPreview = (): void => {
    const documentText = this._getDocument();
    this._warnAboutIcons(documentText);
    this.props.onRunPreview(documentText);
  };

  private readonly _save = (): void => {
    const documentText = this._getDocument();
    this._warnAboutIcons(documentText);
    this.props.onSave(documentText);
  };

  private readonly _cancel = (): void => {
    this._replaceDocument(this.props.value);
    this.props.onCancel();
  };

  private readonly _openFilePicker = (): void => {
    this._fileInput.current?.click();
  };

  private readonly _handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) {
      return;
    }

    readHtmlFile(file)
      .then(content => {
        this._replaceDocument(content);
        this._warnAboutIcons(content);
        this._setStatus(`Imported ${file.name}. Review the draft, then save when ready.`);
      })
      .catch(error => {
        this._setStatus(error instanceof Error ? error.message : 'The selected file could not be read.', true);
      });
  };

  private readonly _download = (): void => {
    try {
      downloadHtmlDocument(this._getDocument());
      this._setStatus(`Downloaded ${DEFAULT_DOWNLOAD_FILENAME}.`);
    } catch {
      this._setStatus('The HTML file could not be downloaded.', true);
    }
  };

  private _getDocument(): string {
    return this._view?.state.doc.toString() ?? this._draft;
  }

  private _replaceDocument(value: string): void {
    this._draft = value;
    if (this._view) {
      this._view.dispatch({
        changes: { from: 0, to: this._view.state.doc.length, insert: value }
      });
    }
  }

  private _setStatus(message: string, isError: boolean = false): void {
    this._statusMessage = message;
    this._statusIsError = isError;
    this.forceUpdate();
  }

  private _warnAboutIcons(documentText: string): void {
    getIconWarnings(documentText).then(warnings => {
      if (warnings.length) {
        this._setStatus(`Warning: ${warnings.join(' ')}`, true);
      }
    }).catch(() => undefined);
  }
}
