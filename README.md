<h1 align="center">initx ⚙️</h1>

<p align="center"><code>initx</code> A more convenient scripting engine</p>

<pre align="center">npx <b>initx &lt;something&gt;</b></pre>

## @initx-plugin/gpg

Gpg plugin for `initx`

## Usage

```bash
npx initx plugin add gpg
```

Select `GPG key management`

### GPG import

Automatically read files ending with `publich.key` and `private.key` in the current directory

```bash
npx initx gpg import
```

### GPG export

Export the public key and private key to the current directory

```bash
# npx initx gpg export [filename]?
npx initx gpg export home
```

`home_public.key` and `home_private.key` will be created in the current directory

### GPG delete

Delete the public key and private key

```bash
# npx initx gpg delete [public|private]?
npx initx gpg delete
```

## Documentation

[initx](https://github.com/initx-collective/initx)
