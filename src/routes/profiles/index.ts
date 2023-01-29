import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

enum Message {
  PROFILE_NOT_FOUND = 'Profile not found'
}

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    ProfileEntity[]
  > {
    return fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id
      });

      if (!profile) {
        throw reply.notFound(Message.PROFILE_NOT_FOUND);
      }

      return profile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      return fastify.db.profiles.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const deletedProfile = await fastify.db.profiles.delete(request.params.id);

      if (!deletedProfile) {
        throw reply.notFound(Message.PROFILE_NOT_FOUND);
      }

      return deletedProfile;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const editedProfile = await fastify.db.profiles.change(request.params.id, request.body);

      if (!editedProfile) {
        throw reply.notFound(Message.PROFILE_NOT_FOUND);
      }
      
      return new Promise<ProfileEntity>(() => {});
    }
  );
};

export default plugin;
