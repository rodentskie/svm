## Description

Monorepo powered by [NX](https://nx.dev/)

[Golang Getting Started](https://github.com/nx-go/nx-go)

✨ **GO library** ✨


```
NAME=env && nx g @obiente-lab/nx-go:library $NAME --directory library/go/$NAME

To remove:
nx g rm <name>
```

✨ **GO application** ✨


```
NAME=api && nx g @obiente-lab/nx-go:application $NAME --directory app/$NAME

To remove:
nx g rm <name>
```

✨ **Commands** ✨

**For Go library**

test
```bash
nx test <name>
```

lint
```bash
nx lint <name>
```

tidy
```bash
nx tidy <name>
```

**For Go Application**

serve
```bash
nx serve <name>
```

lint
```bash
nx lint <name>
```

test
```bash
nx test <name>
```

build
```bash
nx build <name>
```

tidy
```bash
nx tidy <name>
```


[Next Getting Started](https://20.nx.dev/nx-api/next)

✨ **Next library** ✨


```
NAME=theme-switch && nx g @nx/next:lib $NAME \
    --directory library/next/$NAME \
    --bundler none \
    --linter eslint \
    --unitTestRunner jest \
    --style none

To remove:
nx g rm <name>
```

✨ **Next application** ✨


```
NAME=app && nx g @nx/next:app  $NAME --directory app/$NAME

To remove:
nx g rm <name>
```

✨ **Charka Snippets** ✨


```
npx @chakra-ui/cli snippet add --all --outdir library/next/components/src/ --tsx
```