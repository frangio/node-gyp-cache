# `node-gyp-cache` 🌾

**Improve your workflow by caching native dependencies.**

If you're tired of pages and pages of C++ warnings when you just want to develop a JavaScript project, look no further. `node-gyp-cache` caches native dependencies for a **faster workflow**, and silences the compiler output for a **happier experience**. Additionally, it can improve the performance of your continuous integration builds.

> ⚠️ This project is new and experimental. There may be bugs, although I believe the significant improvement in developer experience is worth the risks. Please report anything you find!

## Installation

### Global

Global installation is recommended for the best benefits if you work in an area were native dependencies are commonplace, such as Ethereum development.

```
npm install -g node-gyp-cache
npm config set node_gyp node-gyp-cache

# optional for yarn users
yarn config set node_gyp node-gyp-cache
```

If you ever uninstall, remember to remove this configuration using `npm config delete node_gyp`.


### Local

Local installation is useful for optimizing CI builds.

```
npm install --save-dev node-gyp-cache
echo node_gyp = node-gyp-cache >> .npmrc
```

It will also be necessary to configure your CI to cache `node-gyp-cache`'s cache directory. It will be located in `$XDG_CACHE_HOME/node-gyp-cache`, which is usually `~/.cache/node-gyp-cache`.

## Caveats

If you're developing a JavaScript project under normal circumstances, there should be no caveats.

This tool is designed specifically for caching builds of dependencies installed from a single registry (or its mirrors). For a given package name and version we assume that build artifacts will be the same.

If you are developing a package that itself contains native addons, you should be cautious. The cache will be bypassed if the package being built is not under a `node_modules` directory, so there should be no issues in most scenarios, but this measure can fail under some circumstances (such as installing a development version of the package through a tarball).
