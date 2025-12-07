# CipherFS
A 'file server' that uses Github as encrypted storage. Built with React and TailwindCSS.

## Demo
[The demo repo](https://github.com/MeBadDev/CipherFS-demo)

## Background
Read more about the motivation and design of CipherFS in my [blog post](https://mebaddev.net/blog/introducting-cipherfs)
## How it works
CipherFS uses public Github repositories to store encrypted files. A single repository can contain multiple 'groups' of resources, including files and links. Each group is encrypted with a passphrase provided by the user.

When you provide the correct passphrase, CipherFS decrypts the groups and allows you to access the files and links within them. Files can be downloaded directly, while links open in a new tab.

That's basically it, it's supposed to be simple but took way too long to build :D

## Features
- **Multiple Groups**: Organize your resources into different groups, each with its own passphrase!
- **Cool vibe**: I tried my best to make it look nice!
- **Upload anywhere**: Admin (repository owner) can upload files from any device with internet access, with PAT!
- **Open Source**: The entire project is open source! Well, you know that already since you're reading this :)
