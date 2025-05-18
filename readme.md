
### ⚠️ WARNING: NOT FOR PRODUCTION USE

> **🚧 This project is in active development.**
>
> It is **not stable** and **not ready** for live environments.  
> Use **only for testing, experimentation, or internal evaluation**.
>
> ####❗ Risks of using this in production:
>
> - 🔄 Breaking changes may be introduced at any time
> - 🧪 Features are experimental and may be unstable
> - 🔐 Security has not been audited
> - 💥 Potential for data loss or critical errors
>
> **Please do not deploy this in production environments.**

# Avleon CLI - v0.0.37

### Create Application
```sh
npx @avleon/cli new my_api
```
### Create Controller 
```sh
npx avleon make:controller product
# or shorthand
npx avleon m:c product
# for resource controller with -r flag
npx avleon m:c product -m product -r
```

### Create Model/Entity
```sh
# basic model
npx avleon make:model product
# typeorm model
npx avleon m:m product --orm
```

### Create Service
```sh
# basic service
npx avleon make:service product
# resource service with built-in collection
npx avleon make:service product -m product -r
# resource service with typeorm collection
npx avleon make:service product -m product -r --orm
```

### Create Middleware
```sh
npx avleon make:config product
```

### Create Config
```sh
npx avleon make:config product
```

### Create authoriztion (Experimental)
```sh
npx avleon make:auth jwt
```


