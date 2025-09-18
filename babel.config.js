plugins: [
  ["module:react-native-dotenv", {
    "moduleName": "@env",
    "path": ".env",
  }]
]

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-typescript', // 👈 Ajoute ça
    ],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          "moduleName": "@env",
          "path": ".env",
        }
      ]
    ]
  };
};
