import { useRouter } from 'expo-router';
import RecipeForm from '@/components/RecipeForm';
import { repo } from '@/lib/repo';

export default function CreateScreen() {
  const router = useRouter();
  return (
    <RecipeForm
      submitLabel="레시피 저장"
      resetAfterSubmit
      onSubmit={async (input) => {
        const id = await repo.createRecipe(input);
        router.push(`/recipe/${id}`);
      }}
    />
  );
}
