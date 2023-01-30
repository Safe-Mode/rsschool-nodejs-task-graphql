import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

enum Message {
  USER_NOT_FOUND = 'User not found',
  USER_FAKE_ID = 'Fake id param',
  USER_NOT_FOLLOWED = 'User not followed'
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
      return fastify.db.users.create(request.body);
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
        throw reply.badRequest(Message.USER_FAKE_ID);
      }

      await fastify.db.users.delete(request.params.id);

      const users = await fastify.db.users.findMany();
      const usersSubscribedToDeleted = users.filter(
        (user) => user.subscribedToUserIds.includes(request.params.id)
      );

      usersSubscribedToDeleted.forEach(async (user) => {
        user.subscribedToUserIds.splice(
          user.subscribedToUserIds.indexOf(request.params.id),
          1
        );

        await fastify.db.users.change(user.id, {
          subscribedToUserIds: [...user.subscribedToUserIds]
        });
      });

      const deletedUserProfile = await fastify.db.profiles.findOne({
        key: 'userId',
        equals: request.params.id
      });

      const deletedUserPosts = await fastify.db.posts.findMany({
        key: 'userId',
        equals: request.params.id
      });

      deletedUserPosts.forEach(async ({ id }) => await fastify.db.posts.delete(id));

      if (deletedUserProfile) {
        await fastify.db.profiles.delete(deletedUserProfile?.id);
      }

      return user; 
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
        equals: request.body.userId
      });
      
      if (!user) {
        throw reply.badRequest(Message.USER_FAKE_ID);
      }

      const subscribeToUser = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id
      });

      if (!subscribeToUser) {
        throw reply.badRequest(Message.USER_FAKE_ID);
      }

      await fastify.db.users.change(request.body.userId, {
        subscribedToUserIds: [...user.subscribedToUserIds, request.params.id]
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
        equals: request.body.userId
      });

      if (!user) {
        throw reply.badRequest(Message.USER_FAKE_ID);
      }

      const unsubscribeFromUser = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id
      });

      if (!unsubscribeFromUser) {
        throw reply.badRequest(Message.USER_FAKE_ID);
      }

      if (!user.subscribedToUserIds.includes(unsubscribeFromUser.id)) {
        throw reply.badRequest(Message.USER_NOT_FOLLOWED);
      }

      user.subscribedToUserIds.splice(
        user.subscribedToUserIds.indexOf(request.params.id),
        1
      );

      await fastify.db.users.change(request.body.userId, {
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
        throw reply.badRequest(Message.USER_FAKE_ID);
      }

      return fastify.db.users.change(request.params.id, request.body);
    }
  );
};

export default plugin;
