const gulp   = require('gulp'),
      concat = require('gulp-concat');

gulp.task('default', done => {
    return gulp.src([
            'src/predators.js',
            'src/predators-client.js',
            'src/predators-server.js',
            'src/predators-drawing.js',
            'src/predators-util.js',
        ]).pipe(concat('core.js'))
          .pipe(gulp.dest('public/js/'))
});
