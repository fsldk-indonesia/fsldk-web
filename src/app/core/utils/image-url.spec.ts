import { resolveImageUrl, resolveThumbnailUrl } from './image-url';
import { environment } from '../../../environments/environment';

describe('resolveImageUrl', () => {
  it('returns empty string for a falsy path', () => {
    expect(resolveImageUrl('')).toBe('');
  });

  it('passes through absolute http(s) URLs unchanged', () => {
    expect(resolveImageUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
    expect(resolveImageUrl('http://cdn.example.com/a.jpg')).toBe('http://cdn.example.com/a.jpg');
  });

  it('passes through data: URIs unchanged', () => {
    expect(resolveImageUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
  });

  it('prefixes a leading-slash path with the API base (no /api/v1, no /uploads/)', () => {
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    expect(resolveImageUrl('/legacy/photo.jpg')).toBe(`${base}/legacy/photo.jpg`);
  });

  it('prefixes a bare filename with the API base + /uploads/', () => {
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    expect(resolveImageUrl('abc123.jpg')).toBe(`${base}/uploads/abc123.jpg`);
  });
});

describe('resolveThumbnailUrl', () => {
  it('returns empty string for a falsy path', () => {
    expect(resolveThumbnailUrl('')).toBe('');
  });

  it('inserts _thumb before the extension of a resolved backend path', () => {
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    expect(resolveThumbnailUrl('abc123.jpg')).toBe(`${base}/uploads/abc123_thumb.jpg`);
  });

  it('inserts _thumb before the extension of an already-absolute URL', () => {
    expect(resolveThumbnailUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a_thumb.png');
  });

  it('falls back to the full resolved URL when there is no extension to split on', () => {
    const base = environment.apiBaseUrl.replace('/api/v1', '');
    expect(resolveThumbnailUrl('no-extension-name')).toBe(`${base}/uploads/no-extension-name`);
  });
});
