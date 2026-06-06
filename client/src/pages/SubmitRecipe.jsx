import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Plus, Trash, Check, Upload, Clock, Eye, Send } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getFlagEmoji } from '../utils/flags.js';

export const SubmitRecipe = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originCountry, setOriginCountry] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [mealType, setMealType] = useState("DINNER");
  
  // Ingredients (dynamic rows)
  const [ingredients, setIngredients] = useState([
    { name: "", quantity: 1, unit: "g", isOptional: false }
  ]);

  // Instructions (dynamic steps)
  const [instructions, setInstructions] = useState([
    { stepNumber: 1, description: "", imageUrl: "" }
  ]);

  // Media & Metadata
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [prepTimeMins, setPrepTimeMins] = useState(15);
  const [cookTimeMins, setCookTimeMins] = useState(20);
  const [servings, setServings] = useState(4);
  const [caloriesPerServing, setCaloriesPerServing] = useState(450);
  const [difficulty, setDifficulty] = useState("MEDIUM");
  
  // Tags
  const [selectedTags, setSelectedTags] = useState([]);

  const [uploadingCover, setUploadingCover] = useState(false);

  // Step Navigations
  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  // Ingredients handlers
  const handleAddIngredient = () => {
    setIngredients(prev => [...prev, { name: "", quantity: 1, unit: "g", isOptional: false }]);
  };

  const handleRemoveIngredient = (idx) => {
    if (ingredients.length === 1) return;
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx, field, val) => {
    setIngredients(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Instructions handlers
  const handleAddInstruction = () => {
    setInstructions(prev => [
      ...prev,
      { stepNumber: prev.length + 1, description: "", imageUrl: "" }
    ]);
  };

  const handleRemoveInstruction = (idx) => {
    if (instructions.length === 1) return;
    const filtered = instructions.filter((_, i) => i !== idx);
    // Re-index step numbers
    const reindexed = filtered.map((inst, i) => ({
      ...inst,
      stepNumber: i + 1
    }));
    setInstructions(reindexed);
  };

  const handleInstructionChange = (idx, val) => {
    setInstructions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], description: val };
      return copy;
    });
  };

  // Image Upload handler for cover photo
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingCover(true);
    setError("");
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCoverImageUrl(res.data.imageUrl);
    } catch (err) {
      setError("Cover photo upload failed.");
    } finally {
      setUploadingCover(false);
    }
  };

  // Step image upload handler
  const handleStepImageUpload = async (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setInstructions(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], imageUrl: res.data.imageUrl };
        return copy;
      });
    } catch (err) {
      setError(`Step ${idx + 1} image upload failed.`);
    }
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!title || !description || !originCountry || !cuisineType) {
      setError("Basic recipe information (Step 1) is required.");
      setLoading(false);
      setStep(1);
      return;
    }

    try {
      const payload = {
        title,
        description,
        originCountry,
        cuisineType,
        mealType,
        difficulty,
        prepTimeMins,
        cookTimeMins,
        servings,
        caloriesPerServing,
        coverImageUrl,
        videoUrl,
        ingredients: JSON.stringify(ingredients),
        instructions: JSON.stringify(instructions),
        tags: JSON.stringify(selectedTags)
      };

      const res = await api.post('/recipes', payload);
      setSuccess(res.data.message || "Recipe submitted successfully!");
      setStep(7); // Show success splash screen
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit recipe. Please double check fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl bg-cream-light dark:bg-charcoal-light border border-cream-dark/20 dark:border-charcoal/40 p-8 shadow-md space-y-8">
        
        {/* Header with Step Tracker */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-saffron uppercase tracking-widest">Submit a Recipe</span>
              <h2 className="text-2xl font-bold font-display">Share Your Regional Cuisine</h2>
            </div>
            {step < 7 && (
              <span className="text-xs font-bold text-gray-400">Step {step} of 6</span>
            )}
          </div>

          {/* Progress Bar */}
          {step < 7 && (
            <div className="h-1.5 w-full bg-cream dark:bg-charcoal rounded-full overflow-hidden">
              <div 
                className="h-full bg-saffron transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Display Errors */}
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-600 dark:text-red-400 font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 1: BASIC INFO */}
        {/* ==================================================== */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-saffron">Step 1: Basic Information</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Recipe Title / Dish Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Traditional Spicy Pozole Verde"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 text-xs focus:outline-none focus:border-saffron"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Description / History</label>
              <textarea
                rows="4"
                required
                placeholder="Talk about the recipe's background context, regional significance, and flavor profiles..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-3 text-xs focus:outline-none focus:border-saffron"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Origin Country</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mexico"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 text-xs focus:outline-none focus:border-saffron"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cuisine Style</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mexican"
                  value={cuisineType}
                  onChange={(e) => setCuisineType(e.target.value)}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 text-xs focus:outline-none focus:border-saffron"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Meal Classification</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal p-2.5 text-xs focus:outline-none focus:border-saffron"
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
                <option value="SNACK">Snack</option>
                <option value="DESSERT">Dessert</option>
                <option value="DRINK">Drink</option>
              </select>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 2: INGREDIENTS TABLE */}
        {/* ==================================================== */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-saffron">Step 2: Ingredients List</h3>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="rounded-full bg-saffron/10 border border-saffron/20 px-3 py-1.5 text-xs font-bold text-saffron flex items-center gap-1"
              >
                <Plus size={12} /> Add Ingredient
              </button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center border border-cream-dark/10 dark:border-charcoal/30 p-3 rounded-2xl bg-cream-light/30 dark:bg-charcoal/20">
                  {/* Name */}
                  <div className="flex-1 space-y-1 w-full">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chicken Breast, Rice"
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                      className="w-full rounded-xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="w-full sm:w-20 space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Qty</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                      className="w-full rounded-xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Unit */}
                  <div className="w-full sm:w-20 space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Unit</label>
                    <input
                      type="text"
                      placeholder="g, tbsp, cup"
                      value={ing.unit}
                      onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                      className="w-full rounded-xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Optional checkbox */}
                  <div className="flex items-center gap-1.5 pb-2.5 sm:pb-0">
                    <input
                      type="checkbox"
                      id={`opt-${idx}`}
                      checked={ing.isOptional}
                      onChange={(e) => handleIngredientChange(idx, "isOptional", e.target.checked)}
                      className="rounded accent-saffron h-4 w-4"
                    />
                    <label htmlFor={`opt-${idx}`} className="text-[10px] font-bold text-gray-500 whitespace-nowrap">
                      Optional
                    </label>
                  </div>

                  {/* Delete button */}
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="rounded-xl border border-red-200 text-red-500 p-2 hover:bg-red-50 transition-colors self-end sm:self-center"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 3: STEP-BY-STEP INSTRUCTIONS */}
        {/* ==================================================== */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-saffron">Step 3: Cooking Instructions</h3>
              <button
                type="button"
                onClick={handleAddInstruction}
                className="rounded-full bg-saffron/10 border border-saffron/20 px-3 py-1.5 text-xs font-bold text-saffron flex items-center gap-1"
              >
                <Plus size={12} /> Add Step
              </button>
            </div>

            <div className="space-y-5">
              {instructions.map((inst, idx) => (
                <div key={idx} className="border border-cream-dark/10 dark:border-charcoal/30 p-4 rounded-2xl bg-cream-light/30 dark:bg-charcoal/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-saffron">Step {inst.stepNumber}</span>
                    {instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(idx)}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1"
                      >
                        <Trash size={12} /> Remove
                      </button>
                    )}
                  </div>

                  <textarea
                    rows="3"
                    required
                    placeholder="Describe what occurs in this step..."
                    value={inst.description}
                    onChange={(e) => handleInstructionChange(idx, e.target.value)}
                    className="w-full rounded-xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-3 py-2 text-xs focus:outline-none"
                  />

                  {/* Step Image Upload */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 rounded-lg border border-cream-dark/40 px-3 py-1.5 text-[10px] font-bold hover:bg-cream cursor-pointer dark:border-charcoal-light/30">
                      <Upload size={12} /> {inst.imageUrl ? 'Change Step Photo' : 'Upload Step Photo'}
                      <input type="file" accept="image/*" onChange={(e) => handleStepImageUpload(idx, e)} className="hidden" />
                    </label>
                    {inst.imageUrl && (
                      <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                        <Check size={10} /> Image uploaded!
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 4: COVER IMAGE & VIDEO */}
        {/* ==================================================== */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-saffron">Step 4: Media Uploads</h3>
            
            {/* Cover image upload */}
            <div className="space-y-3 rounded-2xl border-2 border-dashed border-cream-dark/40 dark:border-charcoal/40 p-6 text-center">
              {coverImageUrl ? (
                <div className="space-y-4">
                  <img
                    src={coverImageUrl}
                    alt="Recipe Cover Preview"
                    className="mx-auto h-40 max-w-xs object-cover rounded-xl shadow-sm"
                  />
                  <label className="inline-block rounded-full border border-cream-dark/40 px-6 py-2 text-xs font-bold hover:bg-cream cursor-pointer dark:border-charcoal-light/30">
                    Change Cover Photo
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={32} className="mx-auto text-gray-400" />
                  <h4 className="text-xs font-bold">Upload a Cover Photo</h4>
                  <p className="text-[10px] text-gray-400">Click button below to select image.</p>
                  <label className="inline-block rounded-full bg-saffron px-6 py-2.5 text-xs font-bold text-white shadow cursor-pointer">
                    {uploadingCover ? 'Uploading...' : 'Browse Image'}
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Optional video URL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Optional: YouTube Video URL</label>
              <input
                type="url"
                placeholder="e.g. https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2.5 text-xs focus:outline-none focus:border-saffron"
              />
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 5: TAGS & METADATA */}
        {/* ==================================================== */}
        {step === 5 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-saffron">Step 5: Cook Times & Dietary Info</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Prep Time (mins)</label>
                <input
                  type="number"
                  min="0"
                  value={prepTimeMins}
                  onChange={(e) => setPrepTimeMins(parseInt(e.target.value))}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cook Time (mins)</label>
                <input
                  type="number"
                  min="0"
                  value={cookTimeMins}
                  onChange={(e) => setCookTimeMins(parseInt(e.target.value))}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Servings</label>
                <input
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value))}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Calories per serving</label>
                <input
                  type="number"
                  min="0"
                  value={caloriesPerServing}
                  onChange={(e) => setCaloriesPerServing(parseInt(e.target.value))}
                  className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal px-4 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Difficulty Rating</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-2xl border border-cream-dark/30 dark:border-charcoal-light/30 bg-cream-light dark:bg-charcoal p-2.5 text-xs focus:outline-none"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="CHEF">Chef-Level</option>
              </select>
            </div>

            {/* Dietary Tags */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Select Dietary Tags</label>
              <div className="flex flex-wrap gap-2">
                {["Vegan", "Vegetarian", "Gluten-Free", "Halal", "Kosher", "Jain"].map(tag => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`rounded-lg px-4 py-2 text-xs font-bold border transition-colors ${
                        active 
                          ? 'bg-saffron text-white border-saffron shadow-sm' 
                          : 'border-cream-dark/20 dark:border-charcoal-light/20 bg-cream-light dark:bg-charcoal hover:bg-cream'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 6: PREVIEW & SUBMIT */}
        {/* ==================================================== */}
        {step === 6 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-saffron">Step 6: Preview Your Card</h3>
            <p className="text-xs text-gray-400">Review card visual layouts and details before final submission.</p>

            <div className="max-w-xs mx-auto border border-cream-dark/20 dark:border-charcoal/40 rounded-2xl overflow-hidden bg-cream-light dark:bg-charcoal-light shadow-sm">
              <div className="relative aspect-[4/3]">
                <img
                  src={coverImageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500'}
                  alt={title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-charcoal/70 px-2 py-0.5 text-[10px] text-white">
                  <span>{getFlagEmoji(originCountry)}</span>
                  <span>{originCountry}</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-saffron uppercase">
                  <span>{cuisineType}</span>
                  <span className="bg-saffron/10 px-2 py-0.5 rounded text-charcoal dark:text-cream-light">{difficulty}</span>
                </div>
                <h4 className="text-sm font-bold line-clamp-1">{title || 'Untitled Recipe'}</h4>
                <p className="text-[10px] text-gray-400 line-clamp-2">{description || 'No description provided.'}</p>
                <hr className="border-cream-dark/15 dark:border-charcoal/20" />
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <Clock size={10} />
                  <span>{prepTimeMins + cookTimeMins} mins</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 7: SUCCESS SPLASH */}
        {/* ==================================================== */}
        {step === 7 && (
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check size={32} />
            </div>
            <h3 className="text-2xl font-bold font-display text-green-600">Recipe Uploaded!</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Your recipe has been successfully created and sent to the moderator approval queue. You will see it listed in your dashboard pending moderation.
            </p>
            <div className="pt-4 flex justify-center gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-full bg-saffron px-8 py-3 text-xs font-bold text-white shadow"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Navigation Action Footer Row */}
        {step < 7 && (
          <div className="flex justify-between border-t border-cream-dark/20 dark:border-charcoal/30 pt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="rounded-full border border-cream-dark/40 py-2.5 px-6 text-xs font-bold hover:bg-cream text-charcoal dark:border-charcoal-light/30 flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-full bg-saffron py-2.5 px-6 text-xs font-bold text-white shadow-sm flex items-center gap-1"
              >
                Continue <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-full bg-saffron py-2.5 px-6 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
              >
                <Send size={12} /> {loading ? 'Submitting...' : 'Submit to Queue'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default SubmitRecipe;
