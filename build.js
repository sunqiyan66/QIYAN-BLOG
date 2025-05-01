const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const marked = require('marked');

const postsDir = path.join(__dirname, 'posts');
const distDir = path.join(__dirname, 'dist');
const templateDir = path.join(__dirname, 'templates');

async function buildSite() {
  await fs.remove(distDir);
  await fs.mkdirp(distDir);

  const layoutTemplate = await fs.readFile(path.join(templateDir, 'layout.html'), 'utf-8');
  const postTemplate = await fs.readFile(path.join(templateDir, 'post.html'), 'utf-8');

  const files = await fs.readdir(postsDir);
  const posts = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(postsDir, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    const htmlContent = marked.parse(content);

    const slug = path.basename(file, '.md');
    const postHtml = postTemplate
      .replace('{{title}}', data.title)
      .replace('{{date}}', data.date)
      .replace('{{tags}}', data.tags.join(', '))
      .replace('{{cover}}', data.cover)
      .replace('{{content}}', htmlContent);

    const fullHtml = layoutTemplate.replace('{{content}}', postHtml);
    await fs.writeFile(path.join(distDir, `${slug}.html`), fullHtml);

    posts.push({ ...data, slug });
  }

  // Generate index.html
  let indexList = posts.map(post => `
    <div class="post-card">
      <img src="${post.cover}" class="cover-img" />
      <h2><a href="${post.slug}.html">${post.title}</a></h2>
      <p>${post.date}</p>
      <p>${post.tags.join(', ')}</p>
    </div>
  `).join('\n');

  const indexHtml = layoutTemplate.replace('{{content}}', indexList);
  await fs.writeFile(path.join(distDir, 'index.html'), indexHtml);
}

buildSite()
  .then(() => console.log('✅ QIYAN BLOG built to /dist'))
  .catch(err => console.error('❌ Build failed:', err));
