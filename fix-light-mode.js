const fs = require('fs');
const path = require('path');

const pagesDir = path.join('c:', 'Users', 'retir', 'IdeaProjects', 'lyventix-backend', 'frontend', 'src', 'pages');
const filesToProcess = [
  'BranchesPage.jsx',
  'CashRegisterPage.jsx',
  'CategoriesPage.jsx',
  'CustomerPage.jsx',
  'InventoryPage.jsx',
  'ProductsPage.jsx',
  'ReportsPage.jsx',
  'SuppliersPage.jsx'
];

for (const filename of filesToProcess) {
  const filePath = path.join(pagesDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filename}, not found.`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace bg-[#1e293b] with bg-white dark:bg-[#1e293b]
  content = content.replace(/(?<!dark:)bg-\[\#1e293b\]/g, 'bg-white dark:bg-[#1e293b]');

  // Replace text-white with text-slate-800 dark:text-white
  // But strictly ONLY when inside className="..." and NOT inside a bg-* (except bg-white or dark:bg-)
  content = content.replace(/className=(["'])(.*?)\1/g, (match, quote, classList) => {
    let classes = classList.split(/\s+/);
    let newClasses = [];
    
    // Check if this element has a strong background
    const hasStrongBg = classes.some(c => 
      c.startsWith('bg-') && 
      !c.startsWith('bg-white') && 
      !c.startsWith('dark:bg-') && 
      !c.startsWith('bg-slate-') &&
      !c.startsWith('bg-transparent')
    );

    for (let c of classes) {
      if (!c) continue;

      if (c === 'text-white' && !hasStrongBg && !classes.includes('dark:text-white')) {
        newClasses.push('text-slate-800', 'dark:text-white');
      }
      else if (c === 'text-slate-400' && !classes.includes('dark:text-slate-400')) {
        newClasses.push('text-slate-500', 'dark:text-slate-400');
      }
      else if (c === 'text-slate-300' && !classes.includes('dark:text-slate-300')) {
        newClasses.push('text-slate-600', 'dark:text-slate-300');
      }
      else if (c === 'text-slate-200' && !classes.includes('dark:text-slate-200')) {
        newClasses.push('text-slate-700', 'dark:text-slate-200');
      }
      else if (c.startsWith('border-white/') && !classes.some(x => x.startsWith('dark:border-white/'))) {
        newClasses.push('border-slate-200', `dark:${c}`);
      }
      else if (c === 'bg-white/5' && !classes.includes('dark:bg-white/5')) {
        newClasses.push('bg-slate-100', 'dark:bg-white/5');
      }
      else if (c === 'bg-white/10' && !classes.includes('dark:bg-white/10')) {
        newClasses.push('bg-slate-200', 'dark:bg-white/10');
      }
      else if (c === 'hover:bg-white/5' && !classes.includes('dark:hover:bg-white/5')) {
        newClasses.push('hover:bg-slate-100', 'dark:hover:bg-white/5');
      }
      else if (c === 'hover:bg-white/10' && !classes.includes('dark:hover:bg-white/10')) {
        newClasses.push('hover:bg-slate-200', 'dark:hover:bg-white/10');
      }
      else if (c === 'bg-white/[0.02]' && !classes.includes('dark:bg-white/[0.02]')) {
        newClasses.push('bg-slate-50', 'dark:bg-white/[0.02]');
      }
      else if (c === 'bg-white/[0.03]' && !classes.includes('dark:bg-white/[0.03]')) {
        newClasses.push('bg-slate-50', 'dark:bg-white/[0.03]');
      }
      else if (c === 'hover:bg-white/[0.02]' && !classes.includes('dark:hover:bg-white/[0.02]')) {
        newClasses.push('hover:bg-slate-50', 'dark:hover:bg-white/[0.02]');
      }
      else if (c === 'hover:bg-white/[0.03]' && !classes.includes('dark:hover:bg-white/[0.03]')) {
        newClasses.push('hover:bg-slate-50', 'dark:hover:bg-white/[0.03]');
      }
      else if (c === 'divide-white/5' && !classes.includes('dark:divide-white/5')) {
        newClasses.push('divide-slate-200', 'dark:divide-white/5');
      }
      else if (c === 'divide-white/10' && !classes.includes('dark:divide-white/10')) {
        newClasses.push('divide-slate-200', 'dark:divide-white/10');
      }
      else {
        // keep existing if no modification and not already added by above
        if (!newClasses.includes(c)) {
          newClasses.push(c);
        }
      }
    }
    
    // Remove duplicates safely while preserving order (last appearance logic if needed, but Set is fine)
    const uniqueClasses = [...new Set(newClasses)];
    return `className=${quote}${uniqueClasses.join(' ')}${quote}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${filename}`);
}
console.log('Done.');
