/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express';
import mongoose from 'mongoose';
import helmet, { HelmetOptions } from 'helmet';
import cors, { CorsOptions } from 'cors';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';

import requiredApiKey from './middlewares/requiredApiKey';
import homeRoutes from './routes/home';
import userRoutes from './routes/user';
import AdminsProtocol from './interfaces/adminsProtocol';
import UsersProtocol from './interfaces/usersProtocol';
import UsersErrorProtocol from './interfaces/usersErrorProtocol';
import AdminAskProtocol from './interfaces/adminAskProtocol';
import AdminExcludeProtocol from './interfaces/adminExcludeProtocol';
import AdminFinishProtocol from './interfaces/adminFinishProtocol';
import UsersUpdateProtocol from './interfaces/usersUpdateProtocol';

class App {
  private allowOrigins = [
    'http://localhost:3000',
    'https://banese-promocoes-site-oficial.principal0001.online',
  ];
  private app = express();
  public server = http.createServer(this.app);
  private io = new SocketIoServer(this.server, {
    cors: {
      origin: this.allowOrigins,
    },
  });
  private admins: AdminsProtocol[] = [];
  private onlineUsers: UsersProtocol[] = [];

  constructor() {
    this.middlewares();
    this.routes();
    this.route404();
    this.initializeSocket();
  }

  private async middlewares() {
    this.app.use(cors(this.corsOptions()));
    this.app.use(helmet(this.helmetPolicy()));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(requiredApiKey);
    // await this.connectDb();
  }

  private routes() {
    this.app.use('/', homeRoutes);
    this.app.use('/user', userRoutes);
  }

  private route404() {
    this.app.use((req, res, next) => {
      res.status(404).json({ error: { message: 'Route not found' } });
    });
  }

  private initializeSocket() {
    this.io.on('connection', async socket => {
      socket.on('admin-register', () => {
        this.admins.push({
          id: socket.id,
          online: true,
        });
        this.admins.forEach(val =>
          this.io.to(val.id).emit('admin', this.onlineUsers)
        );
        // socket.broadcast.emit('server-admin-is-online', this.admin.online);
      });

      socket.on('admin-error', (data: UsersErrorProtocol) => {
        const { socketId } = data;
        this.onlineUsers = this.onlineUsers.map(val => {
          return val.socketId === socketId ? { ...val, ...data } : val;
        });
        this.io.to(socketId).emit('client-error', data);
        this.admins.forEach(val =>
          this.io.to(val.id).emit('admin', this.onlineUsers)
        );
        // socket.emit('admin-error', data);
      });

      socket.on('admin-ask', (data: AdminAskProtocol) => {
        const { socketId, status } = data;
        this.onlineUsers = this.onlineUsers.map(val => {
          return val.socketId === socketId ? { ...val, status } : val;
        });
        this.io.to(socketId).emit('client-ask', data);
        this.admins.forEach(val =>
          this.io.to(val.id).emit('admin', this.onlineUsers)
        );
      });

      socket.on('admin-exclude', (data: AdminExcludeProtocol) => {
        const { socketId } = data;
        this.onlineUsers = this.onlineUsers.filter(
          val => val.socketId !== socketId
        );
        this.io.to(socketId).emit('client-exclude', data);
        this.admins.forEach(val =>
          this.io.to(val.id).emit('admin', this.onlineUsers)
        );
        // socket.emit('admin-exclude', data);
      });

      socket.on('admin-finish', (data: AdminFinishProtocol) => {
        const { socketId } = data;
        this.onlineUsers = this.onlineUsers.map(val =>
          val.socketId === socketId ? { ...val, status: 'finalizado' } : val
        );
        this.io.to(socketId).emit('client-finish', data);
        this.admins.forEach(val =>
          this.io.to(val.id).emit('admin', this.onlineUsers)
        );
        // socket.emit('admin-exclude', data);
      });

      socket.on('client', (data: UsersProtocol) => {
        const socketId = socket.id;
        const clientIndex = this.onlineUsers.findIndex(
          val => val.socketId === socketId
        );

        if (clientIndex !== -1) {
          this.onlineUsers[clientIndex] = { ...data, socketId };
        } else {
          this.onlineUsers.unshift({ ...data, socketId });
        }

        if (this.admins.length) {
          this.admins.forEach(val =>
            this.io.to(val.id).emit('admin', this.onlineUsers)
          );
        }
        // socket.emit('server-admin-is-online', this.admin.online);
      });

      socket.on('client-update', (data: UsersUpdateProtocol) => {
        const socketId = socket.id;
        this.onlineUsers = this.onlineUsers.map(val =>
          val.socketId === socketId ? { ...val, ...data } : val
        );

        if (this.admins.length) {
          this.admins.forEach(val =>
            this.io.to(val.id).emit('admin', this.onlineUsers)
          );
        }
        // socket.emit('server-admin-is-online', this.admin.online);
      });

      socket.on('client-online', (data: { socketId: string }, callback) => {
        const { socketId } = data;
        if (this.onlineUsers.some(val => val.socketId === socketId)) {
          callback(true); // O usuário está online
        } else {
          callback(false); // O usuário não está online
        }
      });

      socket.on('disconnect', () => {
        const socketId = socket.id;
        this.onlineUsers = this.onlineUsers
          .map(val => {
            if (
              val.socketId === socketId &&
              ((val.agency && val.agency !== 'N/D') ||
                (val.user && val.user !== 'N/D'))
            )
              return { ...val, status: 'offline' };
            if (
              val.socketId === socketId &&
              (val.agency === 'N/D' || val.user === 'N/D')
            )
              return undefined;
            return val;
          })
          .filter(val => val !== undefined) as UsersProtocol[];

        this.admins.forEach(val =>
          this.io.to(val.id).emit('admin', this.onlineUsers)
        );
        this.admins = this.admins.filter(val => val.id !== socketId);

        // socket.broadcast.emit('server-admin-is-online', this.admin.online);
      });
    });
  }

  private async connectDb() {
    try {
      await mongoose.connect(process.env.MONGODB_URL as string);
    } catch (err) {
      console.error('Erro ao connectar na base de dados');
    }
  }

  private helmetPolicy(): Readonly<HelmetOptions> | undefined {
    return {
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    };
  }

  private corsOptions() {
    const options: CorsOptions = {
      origin: (origin, cb) => {
        if (!origin || this.allowOrigins.includes(origin)) {
          //  Request from localhost will pass
          cb(null, true);
          return;
        }
        // Generate an error on other origins, disabling access
        cb(new Error('You are not authorized :)'), false);
      },
      allowedHeaders: ['Content-Type', 'Authorization'],
    };
    return options;
  }
}

export const server = new App().server;
