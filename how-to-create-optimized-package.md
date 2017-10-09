## How to create an Optimized Package for PRO

In this short tutorial we will learn how to optimize our application specific resources so that it loads faster on the cloud.

Deploying application to the cloud requires more attention to the details & how the Internet work. What works fast on local computer may not work equally fast on the Internet due to network latency.

Luckily, Internet now is better than before and we have developed lots of best practices to optimize the delivery of our resources over the internet. If you are interested to have a deep dive, I encourage you to checkout this book [High Performance Browser Networking](https://hpbn.co)

However you don't need to read 100's pages to provide better user experience. The main things you need to know:

- Test your application with [higher latency](https://developers.google.com/web/tools/chrome-devtools/network-performance/network-conditions#emulate_network_connectivity) to emulate your customers in different parts of the world.

- Only load Javascript & CSS files that you need. For example if you are not using chat-widget, then make sure to delete it.

- Combine all your Javascript & CSS files in one file. What this mean is instead of your browser has to go to the server 10 times to fetch 10 files, it can go one time and fetch them in on go.

- Make sure to optimize your images. A rule of thumb is keep your images size under 100 KB. This mean:
  - Resize all your images to match the size you need.
  - Save all your images in JPG format.
  - Choose a quality of 80%

For deep dive into image optimization check
[Image Optimization](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/image-optimization) and
[Images Guide](https://images.guide)


## How to combine your Javascript & CSS
I wrote a script file to help you achieve this task

## Prerequisites:
- Make sure you have [Git-Bash](https://git-scm.com/downloads) installed
- Make sure you have [Java](https://java.com/en/download) installed

## Steps
- In your desktop right click choose 'Git Bash Here'
- Execute `curl -sSL https://git.io/vdu93 -o build-aimms-pack.sh`
- Execute `./build-aimms-pack.sh your-model-path your-theme-path aimms-version`
- Example `./build-aimms-pack.sh "$HOME/Documents/Ready-To-Eat Meal Production" "$HOME/Documents/Ready-To-Eat Meal Production/WebUI/resources/css/themes/dark" 4.42.2.1106`
- This script will create a 'tmp' folder & aimmspack. Before uploading the aimmspack test your model by opening the tmp folder.