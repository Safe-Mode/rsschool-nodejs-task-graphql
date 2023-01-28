import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

enum Message {
  USER_NOT_FOUND = 'User not found'
}

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id
      });
      
      if (!user) {
        throw reply.notFound(Message.USER_NOT_FOUND);
      }

      return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return fastify.db.users.create({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email
      });
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id
      });
      
      if (!user) {
        throw reply.notFound(Message.USER_NOT_FOUND);
      }

      return fastify.db.users.delete(request.params.id);
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id
      });
      
      if (!user) {
        throw reply.notFound(Message.USER_NOT_FOUND);
      }

      const subscribeToUser = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId
      });

      if (!subscribeToUser) {
        throw reply.notFound('User to subscribe not found');
      }

      await fastify.db.users.change(request.params.id, {
        subscribedToUserIds: [request.body.userId]
      })

      return subscribeToUser;
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id
      });

      if (!user) {
        throw reply.notFound(Message.USER_NOT_FOUND);
      }

      const unsubscribeFromUser = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId
      });

      if (!unsubscribeFromUser) {
        throw reply.notFound('User to unsubscribe not found');
      }

      user.subscribedToUserIds.splice(
        user.subscribedToUserIds.indexOf(request.body.userId)
      );

      await fastify.db.users.change(request.params.id, {
        subscribedToUserIds: [...user.subscribedToUserIds]
      })

      return unsubscribeFromUser;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id
      });
      
      if (!user) {
        throw reply.notFound(Message.USER_NOT_FOUND);
      }

      return fastify.db.users.change(request.params.id, request.body);
    }
  );
};

export default plugin;
