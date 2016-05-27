module.exports = function(app, multipartyMiddleware) {
    app.post('/message', multipartyMiddleware, function(req, res, next) {
        var file = req.files.file;
        var uploadedFile = new File({title: file.name});
        var extension = uploadedFile.title.split('.').pop();
        var tmp_path = file.path;
        var target_path = config.answerPath + uploadedFile._id;
        var sym_path = target_path + "." + extension;

        let question = req.question;

        var message = new Message({question: question, status: "Pending"});
        message.file = uploadedFile;
        console.log('Target path is: ' + target_path);
        // move the file from the temporary location to the intended location
        fs.rename(tmp_path, target_path, function(err) {
            if (err) throw err;
            // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
            fs.unlink(tmp_path, function() {
                fs.symlink(target_path, sym_path, function(err) {
                    if (err) throw err;
                });
                if (err) throw err;
                message.save(function(err) {
                    if(err) {
                        //req.flash('error', 'There was a problem updating your post. Please try again later');
                        console.log('error updating ' + err);
                    } else {
                        console.log("Success!!!");
                        res.send('File uploaded to: ' + target_path + ' - ' + req.files.size + ' bytes');
                    }
                });
            });
        });
    });

    app.post('/upload/question', multipartyMiddleware, function(req, res, next) {
        var file = req.files.file;
        var uploadedFile = new File({title: file.name});
        var extension = uploadedFile.title.split('.').pop();
        var tmp_path = file.path;
        var target_path = config.questionPath + uploadedFile._id;
        var sym_path = target_path + "." + extension;

        var question = new Question();
        question.file = uploadedFile;
        console.log('Target path is: ' + target_path);
        // move the file from the temporary location to the intended location
        fs.rename(tmp_path, target_path, function(err) {
            if (err) throw err;
            // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
            fs.unlink(tmp_path, function() {
                fs.symlink(target_path, sym_path, function(err) {
                    if (err) throw err;
                });
                if (err) throw err;
                question.save(function(err) {
                    if(err) {
                        //req.flash('error', 'There was a problem updating your post. Please try again later');
                        console.log('error updating ' + err);
                    } else {
                        console.log("Success!!!");
                        console.log(question);
                        console.log(target_path);
                        res.send({"_id": question._id});
                    }
                });
            });
        });
    });

    app.post('/upload/message', multipartyMiddleware, function(req, res, next) {
        var file = req.files.file;
        var uploadedFile = new File({title: file.name});
        var extension = uploadedFile.title.split('.').pop();
        var tmp_path = file.path;
        var target_path = config.answerPath + uploadedFile._id;
        var sym_path = target_path + "." + extension;

        var message = new Message();
        message.file = uploadedFile;
        message.status = "Pending";
        console.log('Target path is: ' + target_path);
        // move the file from the temporary location to the intended location
        fs.rename(tmp_path, target_path, function(err) {
            if (err) throw err;
            // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
            fs.unlink(tmp_path, function() {
                fs.symlink(target_path, sym_path, function(err) {
                    if (err) throw err;
                });
                if (err) throw err;
                message.save(function(err) {
                    if(err) {
                        //req.flash('error', 'There was a problem updating your post. Please try again later');
                        console.log('error updating ' + err);
                    } else {
                        console.log("Success!!!");
                        console.log(message);
                        console.log(target_path);
                        res.send({"_id": message._id});
                    }
                });
            });
        });
    });

    app.put('/question', function(req, res, next) {
        console.log("Request is: ", req.body);
        Question.findByIdAndUpdate(req.body.id, req.body, function(err, post) {
            if (err) return next(err);
            console.log(post);
            console.log(req.body)
            res.json(post);
        })
    });

    app.delete('/question/:id', function(req, res, next) {
        Question.findByIdAndRemove(req.params.id, req.body, function (err, post) {
            if (err) return next(err);
            res.json(post);
        });
    });

    app.delete('/message/:id', function(req, res, next) {
        Message.findByIdAndRemove(req.params.id, req.body, function (err, post) {
            if (err) return next(err);
            res.json(post);
        });
    });

    app.put('/message/approve/:id', function(req, res, next) {
        Message.findByIdAndUpdate(req.params.id, { $set: { status: 'Approved' }}, function (err, message) {
            if (err) return handleError(err);
            res.send(message);
        });
    });

    app.put('/message/reject/:id', function(req, res, next) {
        Message.findByIdAndUpdate(req.params.id, { $set: { status: 'Rejected' }}, function (err, message) {
            if (err) return handleError(err);
            res.send(message);
        });
    });

    app.get('/questions', function(req, res) {
        Question.find().sort('voice').exec(function(err, questions) {
            if (err) return next(err);
            res.json(questions);
        });
    });

    app.get('/pending', function(req, res) {
        Message.find({status: 'Pending'}).sort('createdAt').exec(function(err, questions) {
            if (err) return next(err);
            res.json(questions);
        });
    });

    app.get('/rejected', function(req, res) {
        Message.find({status: 'Rejected'}).sort('createdAt').exec(function(err, questions) {
            if (err) return next(err);
            res.json(questions);
        });
    });

    app.get('/approved', function(req, res) {
        Message.find({status: 'Approved'}).sort('createdAt').exec(function(err, questions) {
            if (err) return next(err);
            res.json(questions);
        });
    });

    app.get('/', function(req,res) {
        res.render('index');
    });

    app.get('/modals/:id', function(req, res, next) {
        res.render('modals/' + req.params.id);
    });


    /* Telephone functions */

    app.get('/randomMessage', function(req, res, next) {
        var count = 0;
        Message.count({status: 'Approved'}, function (err, count) {
            if (err) return next(err);
            let randomNumber = Math.floor((Math.random() * count));
            Message.find({status: 'Approved'}).limit(-1).skip(randomNumber).exec(function(err, message) {
                if (err) return next(err);
                let m = message[0];
                var playCount = 1;
                if (m.playCount != null) {
                    playCount = m.playCount + 1;
                }
                console.log(message);
                Message.findByIdAndUpdate(m._id, { $set: { playCount: playCount }}, function (err, message) {
                    if (err) return handleError(err);
                    console.log("Updated play count...");
                });
                res.json(m);
            });
        });
    });

    app.get('/randomQuestion', function(req, res, next) {
        var count = 0;
        Question.count({}, function (err, count) {
            if (err) return next(err);
            let randomNumber = Math.floor((Math.random() * count));
            Question.find().limit(-1).skip(randomNumber).exec(function(err, question) {
                if (err) return next(err);
                let q = question[0];
                var playCount = 1;
                if (q.playCount != null) {
                    playCount = q.playCount + 1;
                }
                Question.findByIdAndUpdate(q._id, { $set: { playCount: playCount }}, function (err, message) {
                    if (err) return handleError(err);
                    console.log("Updated play count...");
                });
                res.json(q);
            });
        });
    });
};
