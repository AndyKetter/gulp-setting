//一，这个gulp.task API用来建立任务。可以透过终端机输入$ gulp styles指令来执行上述任务。
//二，这个gulp.src API用来定义一个或多个来源档案。允许使用glob样式，例如/**/*.scss比对多个符合的档案。传回的串流(stream)让它成为非同步机制，所以在我们收到完成通知之前，确保该任务已经全部完成。
//三，使用pipe()来串流来源档案到某个外挂。外挂的选项通常在它们各自的Github页面中可以找到。上面列表中我有留下各个外挂的连结，让你方便使用。
//四，这个gulp.dest() API是用来设定目的路径。一个任务可以有多个目的地，一个用来输出扩展的版本，一个用来输出缩小化的版本。这个在上述的styles任务中已经有展示。
//五，这个gulp.watch() API是用来监听文件变化的
//六，// gulp.run('sassbulid');//gulp.run API用于执行指定的任务  执行多个任务这样写 gulp.run('lint', 'sass', 'scripts');但是该api已经被弃用了

//所有的src,runSequence前面都必须加上return,watch前面可不return,按标准来写不要省了return,不然runSequence不能实现同步，会出现异步,因为你不写retuan,runSequence插件就不知道你什么时候结束了任务而不能 
  //执行同步操作
var gulp = require('gulp'), 
	gutil = require("gulp-util"),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    rev = require('gulp-rev-append'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    webpack = require('webpack'),              // webpack
    gwebpack = require('gulp-webpack'),
    webpackConfig = require("./webpack.config.js"),
    named = require('vinyl-named'),                 // 配合webpack的命名插件
    // path = require('path'),
    livereload = require('gulp-livereload');
    var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');
    var UglifyJsPlugin = new webpack.optimize.UglifyJsPlugin({
		compress: {
	        warnings: false
	    },
		mangle: {
		    except: ['$super', '$', 'exports', 'require']
		}
	});
    // sassbulid任务
	gulp.task('sassbulid', function () {
	  //编译sass
	  gulp.src('sass/**/*.scss')
	    .pipe(sass().on('error', sass.logError))
	    //添加前缀
	    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
	    //保存未压缩文件到我们指定的目录下面
	    .pipe(gulp.dest('css'))
	    //给文件添加.min后缀
	    .pipe(rename({ suffix: '.min' }))
	    //压缩样式文件
	    .pipe(minifycss())
	    //输出压缩文件到指定目录
	    .pipe(gulp.dest('css'))
	    //提醒任务完成
	    .pipe(notify({ message: 'Styles task complete' }));
	});
	// Scripts任务
	gulp.task('scripts', function() {
	    //js代码校验
	    return gulp.src('js/*.js')
	    .pipe(jshint())
	    .pipe(jshint.reporter('default'))
	    //js代码合并
	    .pipe(concat('all.js'))
	    //给文件添加.min后缀
	    .pipe(rename({ suffix: '.min' }))
	    .pipe(named())
        .pipe(gwebpack({
            // watch: true,
            module: {
                loaders: [
                    {test:/\.js[x]?$/,exclude:/node_modules/,loader:'babel-loader'}
                ],
            },
        }))
	    //压缩脚本文件
	    .pipe(uglify())
	    //输出压缩文件到指定目录
		.pipe(gulp.dest('ujs'))
	    //提醒任务完成
	    .pipe(notify({ message: 'Scripts task complete' }));
	});
	//gwebpack
	gulp.task('gwebpack', function(){
	    gulp.src('wjs/entry.js')
	    	.pipe(jshint())
	    	.pipe(jshint.reporter('default'))
	    	// .pipe(concat('all.js'))
	        .pipe(named())
	        .pipe(gwebpack({
	            // watch: true,
	            plugins:[UglifyJsPlugin,commonsPlugin],
	            module: {
	                loaders: [
                    	{test:/\.js[x]?$/,exclude:/node_modules/,loader:'babel-loader'}
	                ],
	            },
	        }))
	    	.pipe(rename({ suffix: '.min' }))
	        // .pipe(uglify())
	        .pipe(gulp.dest('ujs'))
	        .pipe(notify({ message: 'gwebpack task complete' }));
	});
	//webpack
	gulp.task('webpack',function (callback) {
		var myConfig = Object.create(webpackConfig);
		// run webpack
		webpack(
		  // configuration
		  myConfig
		, function(err, stats) {
		  // if(err) throw new gutil.PluginError("webpack", err);
		  // gutil.log("[webpack]", stats.toString({
		  //	 // output options
		  // }));
		  callback();
		});
	});
	//加版本号
	gulp.task('testRev', function () {
	    gulp.src('./index.html')
	        .pipe(rev())
	        .pipe(gulp.dest('rev/html'));
	});
	//更改名字rename
	gulp.task('rename',function () {
		gulp.src('./index.html')
			.pipe(rename({ suffix: '.min' }))
			.pipe(gulp.dest('rename'));
	});
	// Images任务
	gulp.task('images', function() {
	  return gulp.src('images/*')
	    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
	    .pipe(gulp.dest('images'))
	    .pipe(notify({ message: 'Images task complete' }));
	});
	//clean任务
	gulp.task('clean', function() { 
	  gulp.src(['css/*', 'ujs/*'], {read: false})
	    .pipe(clean({force:true}));
	});   
	gulp.task('default', function () {
	  // gulp.run('sassbulid');//gulp.run API(注意 该api已经被弃用了)用于执行指定的任务  执行多个任务这样写 gulp.run('lint', 'sass', 'scripts');
	  // var server = livereload();
	  //中括号中是一个执行任务的队列数组，可以指定多个任务，队列名字就是gulp.task的第一个参数的名字
	  // Watch .scss files 表明只要sass文件夹下scss文件一有变化，就执行sassbulid任务
	  gulp.watch('sass/*.scss', ['sassbulid']);
	  // Watch .js files
	  gulp.watch('js/*.js',['scripts']);
	  // Watch image files
  	  gulp.watch('images/*', ['images']);
  	  // Create LiveReload server
  	  livereload.listen();
  	  // Watch any files in assets/, reload on change
  	  gulp.watch(['sass/*']).on('change', livereload.changed);
	});
	//注意额外传入gulp.task的阵列。这裡我们可以定义任务相依(task dependencies)。
	//在这个范例中，gulp.start开始任务前会先执行清理(clean)任务。
	//Gulp中所有的任务都是并行(concurrently)执行，并没有先后顺序哪个任务会先完成，
	//所以我们需要确保clean任务在其他任务开始前完成。
	gulp.task('refresh', ['clean'], function() { 
	    gulp.start('sassbulid', 'scripts', 'images');
	});
	//gulp.task('default',['testLess', 'elseTask']); //定义默认任务   这样捆绑执行任务也可以，所以不要用gulp.run
