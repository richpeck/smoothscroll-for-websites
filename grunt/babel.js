module.exports = {
    options: {
        sourceMap: true,
        presets: ['es2015']
    },
    dist: {
        files: {
            '<%= package.paths.build %>/<%= package.name %>.js': '<%= package.paths.src %>/js/SmoothScroll.js'
        }
    }
};