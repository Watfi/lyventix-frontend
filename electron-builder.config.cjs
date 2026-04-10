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
    'package.json',
  ],
  extraMetadata: {
    main: 'electron/main.cjs',
  },
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'public/iconlyventix.ico',
  },
  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    icon: 'public/iconlyventix.ico',
    category: 'public.app-category.business',
  },
  linux: {
    target: [{ target: 'AppImage', arch: ['x64'] }],
    icon: 'public/iconlyventix.ico',
    category: 'Office',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'public/iconlyventix.ico',
    uninstallerIcon: 'public/iconlyventix.ico',
    installerHeaderIcon: 'public/iconlyventix.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
};
