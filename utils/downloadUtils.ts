const triggerAnchorDownload = (href: string, filename: string): void => {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

export const triggerDownload = (href: string, filename: string): void => {
  triggerAnchorDownload(href, filename);
};

export const downloadImage = async (url: string, filename: string): Promise<void> => {
  if (!url) throw new Error('Khong co anh de tai ve.');

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    triggerAnchorDownload(url, filename);
    return;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Khong tai duoc anh (${response.status}).`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    triggerAnchorDownload(objectUrl, filename);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
};
