const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 3000;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect(err => {
    if (err) {
        console.error('데이터베이스 연결 실패:', err);
        return;
    }
    console.log('데이터베이스 연결 성공');
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM members WHERE username = ?', [username], (err, results) => {
        if (err) {
            return res.status(500).send('회원가입 실패');
        }
        if (results.length > 0) {
            return res.status(400).send('중복된 이름입니다');
        }

        const hashedPassword = bcrypt.hashSync(password, 8);

        db.query('INSERT INTO members (username, password) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
            if (err) {
                return res.status(500).send('회원가입 실패');
            }
            res.status(200).send('회원가입 성공');
        });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM members WHERE username = ?', [username], (err, results) => {
        if (err) {
            return res.status(500).send('로그인 실패');
        }
        if (results.length === 0) {
            return res.status(404).send('사용자명이 다릅니다');
        }

        const user = results[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send('비밀번호가 다릅니다');
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: 86400 });

        res.status(200).send({ auth: true, token });
    });
});

app.get('/userinfo', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send('토큰이 필요합니다');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send('토큰 인증 실패');
        
        db.query('SELECT * FROM members WHERE id = ?', [decoded.id], (err, results) => {
            if (err) {
                return res.status(500).send('사용자 정보를 가져올 수 없습니다');
            }
            if (results.length === 0) {
                return res.status(404).send('사용자를 찾을 수 없습니다');
            }
            res.status(200).send(results[0]);
        });
    });
});

app.post('/schedules', (req, res) => {
    const { member_id, title, description, start_date, end_date } = req.body;

    db.query('INSERT INTO schedules (member_id, title, description, start_date, end_date) VALUES (?, ?, ?, ?, ?)', [member_id, title, description, start_date, end_date], (err, results) => {
        if (err) {
            return res.status(500).send('일정 추가 실패');
        }
        res.status(200).send('일정 추가 성공');
    });
});

app.get('/schedules', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send('토큰이 필요합니다');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send('토큰 인증 실패');

        const { filter } = req.query;
        let query = 'SELECT * FROM schedules WHERE member_id = ?';
        const params = [decoded.id];

        if (filter === 'yearly') {
            const currentYear = new Date().getFullYear();
            query += ' AND YEAR(start_date) = ? AND YEAR(end_date) = ?';
            params.push(currentYear, currentYear);
        } else if (filter === 'monthly') {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            query += ' AND YEAR(start_date) = ? AND MONTH(start_date) = ? AND YEAR(end_date) = ? AND MONTH(end_date) = ?';
            params.push(currentYear, currentMonth, currentYear, currentMonth);
        } else if (filter === 'weekly') {
            const currentDate = new Date();
            const dayOfWeek = currentDate.getDay(); 
            const firstDayOfWeek = new Date(currentDate);
            firstDayOfWeek.setDate(currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // 현재 날짜에서 요일 차이 만큼 빼서 월요일 구함
            firstDayOfWeek.setHours(0, 0, 0, 0); 

            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); 
            lastDayOfWeek.setHours(23, 59, 59, 999); 

            query += ' AND start_date >= ? AND end_date <= ?';
            params.push(firstDayOfWeek.toISOString(), lastDayOfWeek.toISOString());
        }

        db.query(query, params, (err, results) => {
            if (err) {
                return res.status(500).send('일정 조회 실패');
            }
            const adjustedResults = results.map(schedule => {
                schedule.start_date = new Date(schedule.start_date);
                schedule.start_date.setDate(schedule.start_date.getDate() + 1);
                schedule.start_date = schedule.start_date.toISOString().split('T')[0];

                schedule.end_date = new Date(schedule.end_date);
                schedule.end_date.setDate(schedule.end_date.getDate() + 1);
                schedule.end_date = schedule.end_date.toISOString().split('T')[0];
                return schedule;
            });
            res.status(200).json(adjustedResults);
        });
    });
});

app.put('/schedules', (req, res) => {
    const { id, title, description, start_date, end_date } = req.body;

    db.query('UPDATE schedules SET title = ?, description = ?, start_date = ?, end_date = ? WHERE id = ?', [title, description, start_date, end_date, id], (err, results) => {
        if (err) {
            return res.status(500).send('일정 수정 실패');
        }
        res.status(200).send('일정 수정 성공');
    });
});

app.delete('/schedules', (req, res) => {
    const { id } = req.body;

    db.query('DELETE FROM schedules WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).send('일정 삭제 실패');
        }
        res.status(200).send('일정 삭제 성공');
    });
});

app.delete('/member', (req, res) => {
    const { id } = req.body;

    db.query('DELETE FROM schedules WHERE member_id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).send('회원 탈퇴 실패: 일정 삭제 중 오류 발생');
        }

        db.query('DELETE FROM members WHERE id = ?', [id], (err, results) => {
            if (err) {
                return res.status(500).send('회원 탈퇴 실패: 회원 정보 삭제 중 오류 발생');
            }
            res.status(200).send('회원 탈퇴 성공');
        });
    });
});

app.listen(port, () => {
    console.log(`서버가 ${port} 에서 실행 중입니다.`);
});
