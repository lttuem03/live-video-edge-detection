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
        self.width = this.video.width;
        self.height = this.video.height;
        
        this.video.addEventListener("play", function() {
            self.timerCallback();
        }, false);
    },
    
    // Nhận vào một ImageData có màu, trả về một ImageData greyscale 
    // Ảnh "greyscale": Xem cả 3 kênh màu đều cùng là kênh intensity (R = G = B, dùng 3 kênh do API context 2D 
    // của Canvas chỉ hỗ trợ format 32-bit cho 4 giá trị RGBA)
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

    // Nhận vào một ImageData greyscale, trả về ImageData ảnh đen trắng phát hiện biên cạnh
    sobelEdgeDetection: function(greyscaleImageData) {
        let gradientImageData = this.context.createImageData(greyscaleImageData.width, greyscaleImageData.height);
        let minGradient = 1024; // Độ chênh đạo hàm không thể vượt quá giá trị 255 * 4 (dùng kernel của Sobel)
        let maxGradient = 0;
        let width = greyscaleImageData.width;
        let height = greyscaleImageData.height;
        let xGradient;
        let yGradient;

        let leftOffset = -4;
        let rightOffset = 4;
        let topOffset = - width * 4;
        let bottomOffset = width * 4;

        let topLeftOffset = topOffset + leftOffset;
        let topRightOffset = topOffset + rightOffset;
        let bottomLeftOffset = bottomOffset + leftOffset;
        let bottomRightOffset = bottomOffset + rightOffset;

        // Tạo ảnh gradient là giá trị cường độ vector đạo hàm của từng điểm ảnh
        // Xử lý các điểm ở góc ảnh
        // Góc trái trên:
        let I = 0; // index của giá trị màu đầu tiên của điểm gốc

        if (width > 2)
            xGradient = greyscaleImageData.data[I + rightOffset] - greyscaleImageData.data[I]; // Lấy điểm ngay bên phải trừ đi điểm gốc
        else
            xGradient = greyscaleImageData.data[0];

        if (height > 2)
            yGradient = greyscaleImageData.data[I + bottomOffset] - greyscaleImageData.data[I]; // Lấy điểm ở phía dưới trừ đi điểm gốc
        else
            yGradient = greyscaleImageData.data[I];

        gradientImageData.data[I] = Math.sqrt(xGradient * xGradient + yGradient * yGradient);
        gradientImageData.data[I + 1] = gradientImageData.data[I];
        gradientImageData.data[I + 2] = gradientImageData.data[I];
        gradientImageData.data[I + 3] = gradientImageData.data[I];

        if (gradientImageData.data[I] < minGradient)
            minGradient = gradientImageData.data[I];
        
        if (gradientImageData.data[I] > maxGradient)
            maxGradient = gradientImageData.data[I];

        // Góc phải trên:
        I = (width - 1) * 4;

        if (width > 2)
            xGradient = greyscaleImageData.data[I] - greyscaleImageData.data[I + leftOffset]; // Lấy điểm gốc trừ đi điểm bên trái nó
        else
            xGradient = greyscaleImageData.data[0];

        if (height > 2)
            yGradient = greyscaleImageData.data[I + bottomOffset] - greyscaleImageData.data[I]; // Lấy điểm ở phía dưới trừ đi điểm gốc
        else
            yGradient = greyscaleImageData.data[I];

        gradientImageData.data[I] = Math.sqrt(xGradient * xGradient + yGradient * yGradient);
        gradientImageData.data[I + 1] = gradientImageData.data[I];
        gradientImageData.data[I + 2] = gradientImageData.data[I];
        gradientImageData.data[I + 3] = gradientImageData.data[I];

        if (gradientImageData.data[I] < minGradient)
            minGradient = gradientImageData.data[I];
        
        if (gradientImageData.data[I] > maxGradient)
            maxGradient = gradientImageData.data[I];

        // Góc phải dưới
        I = ((width * height) - 1) * 4;

        if (width > 2)
            xGradient = greyscaleImageData.data[I] - greyscaleImageData.data[I + leftOffset]; // Lấy điểm gốc trừ đi điểm bên trái nó
        else
            xGradient = greyscaleImageData.data[I];
        
        if (height > 2)
            yGradient = greyscaleImageData.data[I] - greyscaleImageData.data[I + topOffset]; // Lấy điểm gốc trừ đi điểm ngay phía trên nó
        else
            yGradient = greyscaleImageData.data[I];

        gradientImageData.data[I] = Math.sqrt(xGradient * xGradient + yGradient * yGradient);
        gradientImageData.data[I + 1] = gradientImageData.data[I];
        gradientImageData.data[I + 2] = gradientImageData.data[I];
        gradientImageData.data[I + 3] = gradientImageData.data[I];
        
        if (gradientImageData.data[I] < minGradient)
            minGradient = gradientImageData.data[I];
        
        if (gradientImageData.data[I] > maxGradient)
            maxGradient = gradientImageData.data[I];

        // Góc trái dưới
        I = (width * (height - 1)) * 4;

        if (width > 2)
            xGradient = greyscaleImageData.data[I + rightOffset] - greyscaleImageData.data[I]; // Lấy điểm ngay bên phải trừ đi điểm gốc
        else
            xGradient = greyscaleImageData.data[I];
        
        if (height > 2)
            yGradient = greyscaleImageData.data[I] - greyscaleImageData.data[I + topOffset]; // Lấy điểm gốc trừ đi điểm ngay phía trên nó
        else 
            yGradient = greyscaleImageData.data[I];

        gradientImageData.data[I] = Math.sqrt(xGradient * xGradient + yGradient * yGradient);
        gradientImageData.data[I + 1] = gradientImageData.data[I];
        gradientImageData.data[I + 2] = gradientImageData.data[I];
        gradientImageData.data[I + 3] = gradientImageData.data[I];

        if (gradientImageData.data[I] < minGradient)
            minGradient = gradientImageData.data[I];
        
        if (gradientImageData.data[I] > maxGradient)
            maxGradient = gradientImageData.data[I];

        // Xử lý các điểm ở biên ảnh
        let J = width * (height - 1) * 4; // Giá trị index đầu tiên ở hàng cuối cùng

        for (let col = 1; col < width - 1; col++)
        {
            // Với mỗi điểm trên biên ngang trên:
            //    Giá trị đạo hàm theo phương x: lấy điểm bên phải gốc trừ điểm bên trái gốc
            //    Giá trị đạo hàm theo phương y: lấy điểm phía dưới trừ điểm gốc
            I = col * 4;
            xGradient = greyscaleImageData.data[I + rightOffset] - greyscaleImageData.data[I + leftOffset];

            if (height > 2)
                yGradient = greyscaleImageData.data[I + bottomOffset] - greyscaleImageData.data[I];
            else
                yGradient = greyscaleImageData.data[I];

            gradientImageData.data[I] = Math.sqrt(xGradient * xGradient + yGradient * yGradient);
            gradientImageData.data[I + 1] = gradientImageData.data[I];
            gradientImageData.data[I + 2] = gradientImageData.data[I];
            gradientImageData.data[I + 3] = gradientImageData.data[I];

            if (gradientImageData.data[I] < minGradient)
                minGradient = gradientImageData.data[I];
        
            if (gradientImageData.data[I] > maxGradient)
                maxGradient = gradientImageData.data[I];

            // Với mỗi điểm trên biên ngang dưới:
            //    Giá trị đạo hàm theo phương x: lấy điểm bên phải gốc trừ điểm bên trái gốc
            //    Giá trị đạo hàm theo phương y: lấy điểm gốc trừ điểm bên trên điểm gốc
            I = J + col * 4;

            xGradient = greyscaleImageData.data[I + rightOffset] - greyscaleImageData.data[I + leftOffset];

            if (height > 2)
                yGradient = greyscaleImageData.data[I] - greyscaleImageData.data[I + topOffset];
            else
                yGradient = greyscaleImageData.data[I];

            gradientImageData.data[I] = Math.sqrt(xGradient * xGradient + yGradient * yGradient);
            gradientImageData.data[I + 1] = gradientImageData.data[I];
            gradientImageData.data[I + 2] = gradientImageData.data[I];
            gradientImageData.data[I + 3] = gradientImageData.data[I];

            if (gradientImageData.data[I] < minGradient)
                minGradient = gradientImageData.data[I];
        
            if (gradientImageData.data[I] > maxGradient)
                maxGradient = gradientImageData.data[I];
        }

        J = width * 4; // Giá trị index đầu tiên ở cột cuối cùng

        for (let row = 1; row < height - 1; row++)
        {
            // Với mỗi điểm trên biên dọc trái:
            //    Giá trị đạo hàm theo phương x: lấy điểm bên phải gốc trừ điểm gốc
            //    Giá trị đạo hàm theo phương y: lấy điểm phía dưới gốc trừ điểm phía trên gốc
            I = row * 4;
            
            if (width > 2)
                xGradient = greyscaleImageData.data[I + rightOffset] - greyscaleImageData.data[I];
            else
                xGradient = greyscaleImageData.data[I];
            
            yGradient = greyscaleImageData.data[I + bottomOffset] - greyscaleImageData.data[I + topOffset];

            gradientImageData.data[I] = Math.sqrt(xGradient * xGradient + yGradient * yGradient);
            gradientImageData.data[I + 1] = gradientImageData.data[I];
            gradientImageData.data[I + 2] = gradientImageData.data[I];
            gradientImageData.data[I + 3] = gradientImageData.data[I];

            if (gradientImageData.data[I] < minGradient)
                minGradient = gradientImageData.data[I];
        
            if (gradientImageData.data[I] > maxGradient)
                maxGradient = gradientImageData.data[I];

            // Với mỗi điểm trên biên dọc phải:
            //    Giá trị đạo hàm theo phương x: lấy điểm gốc trừ điểm bên trái gốc
            //    Giá trị đạo hàm theo phương y: lấy điểm phía dưới gốc trừ điểm phía trên gốc
            I = J + row * bottomOffset;

            if (width > 2)
                xGradient = greyscaleImageData.data[I] - greyscaleImageData.data[I + leftOffset];
            else
                xGradient = greyscaleImageData.data[I];

            yGradient = greyscaleImageData.data[I + bottomOffset] - greyscaleImageData.data[I + topOffset];

            gradientImageData.data[I] = Math.sqrt(xGradient * xGradient + yGradient * yGradient);
            gradientImageData.data[I + 1] = gradientImageData.data[I];
            gradientImageData.data[I + 2] = gradientImageData.data[I];
            gradientImageData.data[I + 3] = gradientImageData.data[I];

            if (gradientImageData.data[I] < minGradient)
                minGradient = gradientImageData.data[I];
        
            if (gradientImageData.data[I] > maxGradient)
                maxGradient = gradientImageData.data[I];
        }

        // Trong miền ảnh mà không bị tràn nếu áp kernel 3x3 vào
        for (let row = 1; row < height - 1; row++)
        {
            for (let col = 1; col < width - 1; col++)
            {
                I = (row * width + col) * 4;

                // Áp kernel Sobel vào điểm gốc
                // Đạo hàm theo phương x:

                xGradient = greyscaleImageData.data[I + topRightOffset] + greyscaleImageData.data[I + rightOffset] * 2 + greyscaleImageData.data[I + bottomRightOffset];
                xGradient -= greyscaleImageData.data[I + topLeftOffset] + greyscaleImageData.data[I + leftOffset] * 2 + greyscaleImageData.data[I + bottomLeftOffset];

                // Đạo hàm theo phương y:
                yGradient = greyscaleImageData.data[I + bottomLeftOffset] + greyscaleImageData.data[I + bottomOffset] * 2 + greyscaleImageData.data[I + bottomRightOffset];
                yGradient -= greyscaleImageData.data[I + topLeftOffset] + greyscaleImageData.data[I + topOffset] * 2 + greyscaleImageData.data[I + topRightOffset];

                gradientImageData.data[I] = Math.sqrt(xGradient * xGradient + yGradient * yGradient);
                gradientImageData.data[I + 1] = gradientImageData.data[I];
                gradientImageData.data[I + 2] = gradientImageData.data[I];
                gradientImageData.data[I + 3] = gradientImageData.data[I];

                if (gradientImageData.data[I] < minGradient)
                    minGradient = gradientImageData.data[I];
                
                if (gradientImageData.data[I] > maxGradient)
                    maxGradient = gradientImageData.data[I];
            }
        }

        // Tạo ảnh black and white là ảnh phát hiện biên cạnh
        // Lấy ngưỡng T là điểm giữa khoảng [min, max] của tập giá trị gradient
        let edgeImageData = this.context.createImageData(width, height);
        let T = minGradient + (maxGradient - minGradient) / 2;
        
        for (let row = 0; row < height; row++)
            for (let col = 0; col < width; col++)
            {
                I = (row * width + col) * 4;

                if (gradientImageData.data[I] >= T)
                {
                    edgeImageData.data[I] = 255; // R
                    edgeImageData.data[I + 1] = 255; // G
                    edgeImageData.data[I + 2] = 255; // B
                    edgeImageData.data[I + 3] = 255; // A
                }
                else
                {
                    edgeImageData.data[I] = 0; // R
                    edgeImageData.data[I + 1] = 0; // G
                    edgeImageData.data[I + 2] = 0; // B
                    edgeImageData.data[I + 3] = 255; // A
                }
            }
         
        return edgeImageData;
    },

    // Thực hiện tính toán frame mới (edge detection) và vẽ lên canvas kết quả 
    computeAndDrawFrame: function() {
        this.context.drawImage(this.video, 0, 0, this.width, this.height);
        let frame = this.context.getImageData(0, 0, this.width, this.height);
        
        let greyscaleImageData = this.toGreyScale(frame);
        let edgeImageData = this.sobelEdgeDetection(greyscaleImageData);

        this.context.putImageData(edgeImageData, 0, 0);
        return;
    }
  };

document.addEventListener("DOMContentLoaded", () => {
    EdgeDetector.doLoad();
});