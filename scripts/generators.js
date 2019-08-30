const glob = require('glob');
const sizeOf = require('image-size');

hexo.extend.generator.register('art', function (locals) {
  locals.data.art = glob.sync('src/art/*').map(img => {
    const d = sizeOf(img);
    return {
      src: img.replace('src', ''),
      h: d.height,
      w: d.width
    };
  });
});
