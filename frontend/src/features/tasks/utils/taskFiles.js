const DEMO_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
const DEMO_IMAGE_URL = 'https://picsum.photos/seed/btp-document/960/720'

/**
 * @param {string} fileName
 * @returns {{ name: string, url: string | null, kind: 'pdf' | 'image' | 'unsupported', ext: string }}
 */
export function resolveTaskFile(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'pdf') {
    return { name: fileName, url: DEMO_PDF_URL, kind: 'pdf', ext }
  }

  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
    return { name: fileName, url: DEMO_IMAGE_URL, kind: 'image', ext }
  }

  return { name: fileName, url: null, kind: 'unsupported', ext }
}

/**
 * @param {string[]} files
 * @returns {string | null}
 */
export function getPreviewUrlForFileList(files) {
  if (!files?.length) {
    return null
  }

  const resolved = resolveTaskFile(files[0])
  return resolved.url
}
