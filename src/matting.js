function getId(id) {
  return document.getElementById(id);
}

var showBefore = getId('showBefore');
var showAfter = getId('showAfter');
var canvas = getId('canvas');
var ctx = canvas.getContext('2d');
var imgFile;
var blobUrl;
var outline = 50;

getId('input').addEventListener('click', function(){
  getId('headimg').click();
});
//图片预览
getId('headimg').onchange = function(e) {
  imgFile = this.files[0];
  let d_src = URL.createObjectURL(imgFile); 
  showBefore.src = d_src;
  showBefore.onload = function(){
    URL.revokeObjectURL(d_src);
  }
}
getId('download').addEventListener('click', function() {
  if(blobUrl) {
    let a = document.createElement('a');
    a.href = blobUrl;
    a.download = '抠图.png';
    a.click();
  } else {
    alert('请先选择抠图噢');
    return;
  }
})
getId('matting').addEventListener('click', function (event) {
  if(!imgFile) {
    alert('请先选择图片噢');
    return;
  }

  let imgReader = new FileReader();
  if(!rightFix()) {
    alert("图片的格式需要为png/jpg/jpeg噢~");
    return;
  }

  imgReader.readAsDataURL(imgFile);
  imgReader.onload = (e) => {
    let originImg = new Image();
    originImg.src = e.target.result;
    originImg.onload = () => {
      let width = originImg.width;
      let height = originImg.height;
      dealImg(width, height, originImg);
    }
  }
});

/**
* function 抠图完整逻辑
* @param {number} width
* @param {number} height
* @param {Image} originImg
*/
function dealImg(width, height, originImg) {
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(originImg, 0, 0);

  let tl = Array.prototype.slice.call(ctx.getImageData(0, 0, 1, 1).data);
  let tr = Array.prototype.slice.call(ctx.getImageData(width - 1, 0, 1, 1).data);
  let br = Array.prototype.slice.call(ctx.getImageData(width - 1, height - 1, 1, 1).data);
  let bl = Array.prototype.slice.call(ctx.getImageData(0, height - 1, 1, 1).data);

  if(tl[3] === 0 || tr[3] === 0 || br[3] === 0 || bl[3] === 0) {
    alert('此图已经被抠过了哦');
    return;
  }

  let avgPixel = [];
  for(let i = 0; i < 4; i++){
    avgPixel[i] = (tl[i] + tr[i] + br[i] + bl[i]) / 4;
  }

  let imgPixel = ctx.getImageData(0, 0, width, height);
  let imgPixelData = imgPixel.data;
  for (let i = 0; i < imgPixelData.length; i += 4) {
    let pixelR = imgPixelData[i];
    let pixelG = imgPixelData[i + 1];
    let pixelB = imgPixelData[i + 2];

    let outFlag = [pixelR, pixelG, pixelB].every((item, index) => {
      return item > ( avgPixel[index] - outline ) && item < ( avgPixel[index] + outline )
    })
    if(outFlag) {
      imgPixelData[i + 3] = 0;
    }
  }

  ctx.putImageData(imgPixel, 0, 0);
  // dataUrl = canvas.toDataURL("image/png");
  // 由于浏览器实现，a标签href无法承载过长base64，所以对于大图片需要转bloburl下载，否则会出现network error
  canvas.toBlob(function(blob) {
    blobUrl = URL.createObjectURL(blob);
    showAfter.src = blobUrl;
  });

}

/**
* function 判断图片是否为以下格式之一，若是则返回true
* @return {boolean}
*/
function rightFix() {
  let suffix = imgFile.name.substring(imgFile.name.lastIndexOf('.')+1);
  if(suffix !== 'png' && suffix !== 'PNG' && suffix !== 'jpg' && suffix !== 'JPG' && suffix !== 'jpeg') {
    return false;
  }
  return true;
}