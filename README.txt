使用到的技术
页面部分： ReactJS + Webpack
服务器： NodeJs

如何以调试方式启动：
1. 在根目录和client目录分别执行npm install
2. 使用NodeJs启动根目录下的server.js
3. 在client目录下执行npm start
4. 在根目录下创建一个uploads目录

如何访问：
先访问模拟登陆页面：localhost:3001/login/login.html
输入用户名和会议室号后，会跳转到collaboration页面，跳转后的url可以保存下来反复使用

如何以production方式启动：
1. 在client目录下执行npm build
2. 使用NodeJs启动根目录下的server