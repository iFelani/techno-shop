import { object, string, number, array } from "yup";

const create = object({
  title: string().required("عنوان الزامی است.").min(5, "عنوان باید حداقل 5 کاراکتر باشد.").max(100, "عنوان باید حداکثر 100 کاراکتر باشد."),
  englishTitle: string().required("عنوان انگلیسی الزامی است.").min(5, "عنوان انگلیسی باید حداقل 5 کاراکتر باشد.").max(100, "عنوان انگلیسی باید حداکثر 100 کاراکتر باشد."),
  description: string().required("توضیحات الزامی است.").min(10, "توضیحات باید حداقل 10 کاراکتر باشد.").max(200, "توضیحات باید حداکثر 200 کاراکتر باشد."),
  percent: number().required("درصد الزامی است.").min(1, "درصد باید حداقل 1 باشد.").max(100, "درصد باید حداکثر 100 باشد."),
  expiresAt: number().required("انقضا الزامی است.").min(1, "انقضا باید حداقل 1 ساعت باشد.").max(10000, "انقضا باید حداکثر 10000 ساعت باشد."),
  categories: array().required("دسته‌بندی‌ ها الزامی هستند.").min(1, "دسته‌بندی‌ ها باید حداقل 1 عدد باشند.").max(7, "دسته‌بندی‌ ها باید حداکثر 7 عدد باشند.").of(string().matches(/^[a-fA-F\d]{24}$/, "دسته‌بندی‌ نامعتبر است.")),
});

const update = object({
  title: string().required("عنوان الزامی است.").min(5, "عنوان باید حداقل 5 کاراکتر باشد.").max(100, "عنوان باید حداکثر 100 کاراکتر باشد."),
  englishTitle: string().required("عنوان انگلیسی الزامی است.").min(5, "عنوان انگلیسی باید حداقل 5 کاراکتر باشد.").max(100, "عنوان انگلیسی باید حداکثر 100 کاراکتر باشد."),
  description: string().required("توضیحات الزامی است.").min(10, "توضیحات باید حداقل 10 کاراکتر باشد.").max(200, "توضیحات باید حداکثر 200 کاراکتر باشد."),
  percent: number().required("درصد الزامی است.").min(1, "درصد باید حداقل 1 باشد.").max(100, "درصد باید حداکثر 100 باشد."),
  expiresAt: number().required("انقضا الزامی است.").min(1, "انقضا باید حداقل 1 ساعت باشد.").max(10000, "انقضا باید حداکثر 10000 ساعت باشد."),
});

export default { create, update };