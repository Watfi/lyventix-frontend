module.exports = {
  appId: 'com.lyventix.app',
  productName: 'Lyventix',
  copyright: 'Copyright © 2025 Lyventix',
  directories: {
    output: 'release',
    buildResources: 'public',
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'node_modules/**/*',
    'package.json',
  ],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'public/iconlyventix.png',
  },
  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    icon: 'public/iconlyventix.png',
    category: 'public.app-category.business',
  },
  linux: {
    target: [{ target: 'AppImage', arch: ['x64'] }],
    icon: 'public/iconlyventix.png',
    category: 'Office',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'public/iconlyventix.png',
    uninstallerIcon: 'public/iconlyventix.png',
    installerHeaderIcon: 'public/iconlyventix.png',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
};
