# KCforum 论坛前端界面
环境准备：nodejs 22.x 以上 npm 10.x 以上

## 推荐使用vscode

[VSCode](https://code.visualstudio.com/)

## 项目启动

```sh
npm install
```

## 修改环境变量
根据后端端口进行修改 src/util/request 里面的端口，默认后端58080
注意：由于开发的问题和重构需要的时间问题，一些接口并没有都抽取到 src/api下面 后续会完善

### 项目启动
```sh
npm run dev
```

### 项目打包

```sh
npm run build
```
