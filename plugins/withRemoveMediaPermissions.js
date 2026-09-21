const { withAndroidManifest } = require("expo/config-plugins");

const PERMISSIONS_TO_REMOVE = [
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.READ_MEDIA_VIDEO",
  "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
  "android.permission.READ_MEDIA_AUDIO",
];

module.exports = function withRemoveMediaPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    manifest.$ = {
      ...manifest.$,
      "xmlns:tools": "http://schemas.android.com/tools",
    };

    manifest["uses-permission"] =
      (manifest["uses-permission"] || []).filter(
        (permission) =>
          !PERMISSIONS_TO_REMOVE.includes(
            permission?.$?.["android:name"]
          )
      );

    manifest["uses-permission"] = [
      ...(manifest["uses-permission"] || []),
      ...PERMISSIONS_TO_REMOVE.map((permission) => ({
        $: {
          "android:name": permission,
          "tools:node": "remove",
        },
      })),
    ];

    return config;
  });
};