# Instructions
Instructions for developing in the shim branch of xterm.js

## Development
```
shell A: yarn esbuild-watch
shell B: yarn esbuild-demo-watch
shell C: yarn start
```

## Rebasing
```
sync fork on github
git fetch origin
git rebase origin/master
git push --force-with-lease
```
