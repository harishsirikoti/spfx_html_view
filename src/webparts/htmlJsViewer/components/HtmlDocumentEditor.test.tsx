import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HtmlDocumentEditor, {
  createHtmlEditorState,
  DEFAULT_DOWNLOAD_FILENAME,
  downloadHtmlDocument,
  MAX_HTML_FILE_BYTES,
  readHtmlFile,
  validateHtmlFile
} from './HtmlDocumentEditor';

describe('HtmlDocumentEditor', () => {
  it('creates an HTML editor state with the complete document', () => {
    const state = createHtmlEditorState('<html><style>body { color: red; }</style><p>Sample</p></html>', () => undefined);

    expect(state.doc.toString()).toContain('<style>');
    expect(state.doc.toString()).toContain('<p>Sample</p>');
  });

  it('renders preview, save, and cancel actions', () => {
    const markup = renderToStaticMarkup(
      <HtmlDocumentEditor value="<html></html>" onRunPreview={() => undefined} onSave={() => undefined} onCancel={() => undefined} />
    );

    expect(markup).toContain('Run Preview');
    expect(markup).toContain('Save');
    expect(markup).toContain('Cancel');
    expect(markup).toContain('Upload HTML');
    expect(markup).toContain('Download HTML');
  });

  it('validates HTML file extensions and size', () => {
    expect(validateHtmlFile({ name: 'page.html', size: 10 })).toBeUndefined();
    expect(validateHtmlFile({ name: 'page.HTM', size: 10 })).toBeUndefined();
    expect(validateHtmlFile({ name: 'page.txt', size: 10 })).toContain('.html or .htm');
    expect(validateHtmlFile({ name: 'page.html', size: MAX_HTML_FILE_BYTES + 1 })).toContain('1 MB');
  });

  it('reads UTF-8 HTML file contents without changing line breaks', async () => {
    const content = '<!doctype html>\n<style>\n.card { animation: pulse 1s; }\n</style>\n';
    const file = new File([content], 'sample.html', { type: 'text/html' });

    await expect(readHtmlFile(file)).resolves.toBe(content);
  });

  it('downloads the exact draft content with a stable filename', async () => {
    const content = '<html>\n<style>.card { color: red; }</style>\n</html>';
    const createObjectUrl = jest.fn().mockReturnValue('blob:test');
    const revokeObjectUrl = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    downloadHtmlDocument(content);

    expect(createObjectUrl).toHaveBeenCalledWith(expect.objectContaining({ type: 'text/html;charset=utf-8' }));
    const blobText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(createObjectUrl.mock.calls[0][0] as Blob, 'utf-8');
    });
    expect(blobText).toBe(content);
    expect(click).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test');
    expect(DEFAULT_DOWNLOAD_FILENAME).toBe('html-css-template.html');

    delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL;
    delete (URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL;
    click.mockRestore();
  });
});
