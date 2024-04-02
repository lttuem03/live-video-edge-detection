// REFERENCE: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Manipulating_video_using_canvas
let EdgeDetector = {
    // Hàm call back gọi mỗi khi sang frame tiếp theo
    timerCallback: function() {
        if (this.video.paused || this.video.ended) {
            return;
        }

        this.computeAndDrawFrame();
        let self = this;
        
        setTimeout(function () {
            self.timerCallback();
        }, 1000 / 60); // render at 60fps
    },
    
    // Hàm khởi tạo khi tất cả nội dung đã được load xong
    doLoad: function() {
        this.video = document.getElementById("input-video");
        this.canvas = document.getElementById("edge-detected-canvas");
        this.context = this.canvas.getContext("2d", {willReadFrequently: true});
        
        let self = this;
        self.width = 640;
        self.height = 360;
        
        this.video.addEventListener("play", function() {
            self.timerCallback();
        }, false);
    },
    
    // Nhận vào một ImageData có màu, trả về một ImageData greyscale 
    // Ảnh "greyscale": Xem cả 3 kênh màu đều cùng là kênh intensity (R = G = B, dùng 3 kênh do API context 2D của Canvas chỉ hỗ trợ format 32-bit cho)
    toGreyScale: function(colorImageFrame) {
        let data = colorImageFrame.data;
        let greyscaleImageData = this.context.createImageData(colorImageFrame.width, colorImageFrame.height);

        for (let i = 0; i < data.length; i += 4)
        {
            // NTSC convertion formula from RGB to greyscale: 0.299 * Red + 0.587 * Green + 0.114 * Blue
            let intensity = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

            greyscaleImageData.data[i] = intensity; // R
            greyscaleImageData.data[i + 1] = intensity; // G
            greyscaleImageData.data[i + 2] = intensity; // B
            greyscaleImageData.data[i + 3] = 255; // A
        }
        
        return greyscaleImageData;
    },

    sobelEdgeDetection: function() {

    },

    // Thực hiện tính toán frame mới (edge detection) và vẽ lên canvas kết quả 
    computeAndDrawFrame: function() {
        this.context.drawImage(this.video, 0, 0, this.width, this.height);
        let frame = this.context.getImageData(0, 0, this.width, this.height);
        
        let greyscaleImageFrame = this.toGreyScale(frame);
        let edgeImageFrame = this.sobelEdgeDetection(greyscaleImageFrame);

        this.context.putImageData(greyscaleImageFrame, 0, 0);
        return;
    }
  };

document.addEventListener("DOMContentLoaded", () => {
    EdgeDetector.doLoad();
});