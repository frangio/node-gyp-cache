# `nicer-node-gyp` 🌾

**Improve your workflow by caching native dependencies.**

If you're tired of pages and pages of C++ warnings when you just want to develop a JavaScript project, look no further. `nicer-node-gyp` caches native dependencies for a **faster** workflow, and silences the compiler output for a **happier** experience.

Additionally, using `nicer-node-gyp` you can improve the performance of your continuous integration builds.

## Installation

### Global

```
npm install -g nicer-node-gyp
npm config set node_gyp nicer-node-gyp

# optional for yarn users
yarn config set node_gyp nicer-node-gyp
```

If you ever uninstall, remember to remove this configuration using `npm config delete node_gyp`.


### Local

```
npm install --save-dev nicer-node-gyp
echo node_gyp = nicer-node-gyp >> .npmrc
```
