/**
 * Strip high-risk HTML constructs before rendering trusted CMS/contract markup.
 * Not a full HTML sanitizer; removes scripts, event handlers, and javascript: URLs.
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return ''
  }

  if (typeof DOMParser === 'undefined') {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/\s(href|src|xlink:href)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, '')
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script,iframe,object,embed,link,meta,base,form').forEach((el) => el.remove())

  doc.querySelectorAll('*').forEach((el) => {
    ;[...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase()
      const value = attr.value || ''

      if (name.startsWith('on')) {
        el.removeAttribute(attr.name)
        return
      }

      if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^\s*javascript:/i.test(value)) {
        el.removeAttribute(attr.name)
      }
    })
  })

  return doc.body.innerHTML
}
