"use strict";

const del = require("del");
const debug = require("gulp-debug");
const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const stylus = require("gulp-stylus");
const browserSync = require("browser-sync").create();
const resolver = require("stylus").resolver;
const svgSprite = require("gulp-svg-sprite");
const gulpIf = require("gulp-if");
const cssnano = require("gulp-cssnano");
const rev = require("gulp-rev");
const revReplace = require("gulp-rev-replace");
const combine = require("stream-combiner2").obj;
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const concat = require("gulp-concat");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");

const isDevelopment =
  !process.env.NODE_ENV || process.env.NODE_ENV == "development";

gulp.task("styles", function() {
  let resolve = resolver();
  let manifest;

  try {
    if (!isDevelopment) {
      manifest = require("./manifest/styles-assets.json");
    }
  } catch (e) {}

  function url(urlLiteral) {
    urlLiteral = resolve.call(this, urlLiteral); // call stylus resolver
    for (let asset in manifest) {
      if (urlLiteral.val == `url("${asset}")`) {
        urlLiteral.string = urlLiteral.val = `url("${manifest[asset]}")`;
      }
    }
    return urlLiteral;
  }

  url.options = resolve.options;
  url.raw = true;

  return (
    gulp
      .src([
        "frontend/styles/index.styl",
        "!frontend/styles/*.{gif,jpg,png,svg,eot,otf,ttf,woff}"
      ])
      .pipe(
        plumber({
          errorHandler: notify.onError(err => ({
            title: "Styles",
            message: err.message
          }))
        })
      )
      .pipe(gulpIf(isDevelopment, sourcemaps.init())) // Generate sourcemaps only on development
      .pipe(
        stylus({
          import: process.cwd() + "/tmp/styles/sprite", // import to stylus from tmp/..
          define: {
            url: url
          }
        })
      )
      .pipe(gulpIf(isDevelopment, sourcemaps.write()))
      .pipe(gulpIf(!isDevelopment, combine(cssnano(), rev())))
      // CSS nano if isn't development. rev -index-abgdsh.css Fro long term caching
      .pipe(gulp.dest("public/styles"))
      .pipe(
        gulpIf(
          !isDevelopment,
          combine(rev.manifest("styles.json"), gulp.dest("manifest"))
        )
      )
  );
  // rev.manifest() публикуем манифест что во что переименовали (с хешем). Направляем в 'manifest'
});

gulp.task("styles:assets", function() {
  return gulp
    .src(
      [
        "frontend/styles/**/*.{gif,jpg,png,svg,eot,otf,ttf,woff}",
        "!frontend/styles/svgsprites/**/*.*"
      ],
      { since: gulp.lastRun("styles:assets") }
    )
    .pipe(imagemin())
    .pipe(gulpIf(!isDevelopment, rev()))
    .pipe(gulp.dest("public/styles"))
    .pipe(
      gulpIf(
        !isDevelopment,
        combine(rev.manifest("styles-assets.json"), gulp.dest("manifest"))
      )
    );
});

gulp.task("clean", function() {
  return del("public", "tmp", "manifest");
});

gulp.task("assets", function() {
  return gulp
    .src("frontend/assets/**/*.*", { since: gulp.lastRun("assets") })
    .pipe(
      gulpIf(
        !isDevelopment,
        revReplace({
          // Replace *.css, *.js from manifest
          manifest: gulp.src(
            [
              "manifest/styles.json",
              "manifest/styles-assets.json",
              "manifest/scripts.json",
              "manifest/scripts-libs.json"
            ],
            {
              allowEmpty: true
            }
          )
        })
      )
    ) // allowEmpty - флаг допустимости пустого агрумента src
    .pipe(gulp.dest("public"));
});

gulp.task("styles:svgsprites", function() {
  return gulp
    .src("frontend/styles/svgsprites/**/*.svg") // Need all files for rebuild
    .pipe(
      svgSprite({
        // svg-sprite
        mode: {
          css: {
            dest: ".",
            bust: !isDevelopment,
            sprite: "sprite.svg",
            layout: "vertical",
            prefix: "$",
            dimensions: true,
            render: { styl: { dest: "sprite.styl" } }
          }
        }
      })
    ) // where to put style && sprite, // if not dev add hesh to file // filename for sprite relative to dest // change .svg-* classes to $ variable for stylus // filename for .styl relative to dest^
    .pipe(debug({ title: "styles:svgsprites" }))
    .pipe(
      gulpIf("*.styl", gulp.dest("tmp/styles"), gulp.dest("public/styles"))
    );
});

gulp.task("scripts", function() {
  return combine(
    gulp.src([
      "frontend/scripts/script01_form_check.js",
      "frontend/scripts/script01.js",
      "frontend/scripts/blocks/slider.js",
      "frontend/scripts/index.js"
    ]),
    gulpIf(isDevelopment, sourcemaps.init()),
    concat("app.js"),
    babel(),
    gulpIf(isDevelopment, sourcemaps.write()),
    gulpIf(!isDevelopment, combine(uglify(), rev())),
    gulp.dest("public/scripts"),
    gulpIf(
      !isDevelopment,
      combine(rev.manifest("scripts.json"), gulp.dest("manifest"))
    )
  ).on(
    "error",
    notify.onError(err => ({ title: "Scripts", message: err.message }))
  );
});

gulp.task("scripts:libs", function() {
  return gulp
    .src("frontend/scripts/libs/*.js", {
      since: gulp.lastRun("scripts:libs")
    })
    .pipe(gulpIf(!isDevelopment, combine(uglify(), rev())))
    .pipe(gulp.dest("public/scripts/libs"))
    .pipe(
      gulpIf(
        !isDevelopment,
        combine(rev.manifest("scripts-libs.json"), gulp.dest("manifest"))
      )
    );
});

gulp.task(
  "build",
  gulp.series(
    "clean",
    "styles:assets",
    "styles:svgsprites",
    "styles",
    "scripts:libs",
    "scripts",
    "assets"
  )
);

gulp.task("watch", function() {
  gulp.watch(
    ["frontend/styles/**/*.styl", "tmp/styles/sprite.svg"],
    gulp.series("styles")
  );
  gulp.watch("frontend/assets/**/*.*", gulp.series("assets"));
  gulp.watch(
    "frontend/styles/**/*.{gif,jpg,png,svg,eot,otf,ttf,woff}",
    gulp.series("styles:assets")
  );
  gulp.watch(
    "frontend/styles/svgsprites/**/*.svg",
    gulp.series("styles:svgsprites")
  );
  gulp.watch(
    ["!frontend/scripts/libs/*.js", "frontend/scripts/**/*.*"],
    gulp.series("scripts")
  );
  gulp.watch("frontend/scripts/libs/*.js", gulp.series("scripts:libs"));
});

gulp.task("serve", function() {
  browserSync.init({
    server: "public"
  });
  browserSync.watch("public/**/*.*").on("change", browserSync.reload);
});

gulp.task("dev", gulp.series("build", gulp.parallel("watch", "serve")));
