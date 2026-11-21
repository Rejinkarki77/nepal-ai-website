// Sends www.nexaflownp.com to nexaflownp.com (301) so search engines see one site.
// Path and query string are kept. Every other host (the main domain, branch previews) passes through.
export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  if (url.hostname === 'www.nexaflownp.com') {
    url.hostname = 'nexaflownp.com';
    return Response.redirect(url.toString(), 301);
  }
  return next();
};
